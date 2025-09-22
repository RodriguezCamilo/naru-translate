import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createSupabaseServer } from "@/lib/supabase-server";
import { allow, ratelimitHeaders } from "@/lib/ratelimit";
import { getClientIp } from "@/lib/get-ip";

const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_KEY || "";
const MODEL_NAME = "gemini-2.0-flash";     // multimodal ok
export const runtime = "nodejs";

// Créditos por ROI más altos que el pipeline OCR
const CREDITS_PER_ROI_DIRECT = 10;

// Límites defensivos
const MAX_ROIS = 32;                       // menos que 64: IA multimodal es cara
const MAX_CROP_BASE64 = 1_600_000;         // ~1.2MB binarios aprox

type Crop = { id: number | string; b64: string }; // PNG/JPEG base64 (dataURL o solo base64)
type Meta = {
  requestId: string;
  source_lang: string;     // "ja" | "en"
  target_lang: string;     // "es"
  roi_count: number;       // #ROIs
  image_w?: number;        // opcional: métricas de la página original
  image_h?: number;
};

export async function POST(req: NextRequest) {
  try {
    // Auth
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Rate-limit (user + IP)
    const ip = getClientIp(req);
    const hitUser = allow(`tdirect:${user.id}`, 30, 60_000);  // 30/min por user
    const hitIp   = allow(`ip:${ip}`,          60, 60_000);   // 60/min por IP
    if (!hitUser.ok || !hitIp.ok) {
      const headers = ratelimitHeaders(
        Math.min(hitUser.remaining, hitIp.remaining),
        Math.max(hitUser.resetAt, hitIp.resetAt)
      );
      return new NextResponse(JSON.stringify({ error: "Too Many Requests" }), { status: 429, headers });
    }

    if (!GEMINI_KEY) {
      return NextResponse.json({ error: "Falta GEMINI_API_KEY" }, { status: 500 });
    }

    const body = (await req.json()) as {
      meta: Meta;
      from: "ja" | "en";
      crops: Crop[];                // [{id, b64}]
    };

    const { meta, from, crops } = body || {};
    if (!meta?.requestId || !crops?.length) {
      return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
    }

    if (meta.roi_count !== crops.length) {
      return NextResponse.json({ error: "roi_count no coincide con crops" }, { status: 400 });
    }
    if (crops.length > MAX_ROIS) {
      return NextResponse.json({ error: "Demasiados globos (modo IA directa)" }, { status: 413 });
    }

    // Pequeña sanidad de base64
    for (const c of crops) {
      const raw = (c.b64.includes(",") ? c.b64.split(",").pop()! : c.b64).trim();
      if (raw.length > MAX_CROP_BASE64) {
        return NextResponse.json({ error: `ROI ${c.id}: imagen demasiado grande` }, { status: 413 });
      }
      // formato: opcionalmente podrías validar mime con el prefijo
    }

    // Créditos necesarios: más caros por ROI
    const needed = crops.length * CREDITS_PER_ROI_DIRECT;

    // Llamada a Gemini multimodal (un solo request con muchos recortes)
    const genAI = new GoogleGenerativeAI(GEMINI_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const prompt = `
Eres un traductor profesional de manga.
Para cada imagen de globo (ROI), realiza OCR + traducción del ${from === "en" ? "inglés" : "japonés"} al español neutro latinoamericano.
- Devuelve SOLO JSON válido:
{"items":[{"id":"<id>","text":"<es>"}]}
- Mantén el orden y el id tal cual.
- Sé natural y conversacional. No dejes palabras en ${from === "en" ? "inglés" : "japonés"}.
- Si no hay texto legible, devuelve text = "" para ese id.
`.trim();

    // Construimos "contents": ponemos un texto guía y luego pares (texto con id + imagen)
    const parts: any[] = [{ text: prompt }];
    for (const c of crops) {
      const data = (c.b64.includes(",") ? c.b64.split(",").pop()! : c.b64).trim();
      // Si conocés el mime por prefijo, úsalo. Default a "image/png".
      const mime = c.b64.startsWith("data:image/jpeg") ? "image/jpeg" : "image/png";
      parts.push({ text: `ROI id=${c.id}` });
      parts.push({ inlineData: { data, mimeType: mime } });
    }

    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
      generationConfig: { temperature: 0.2, responseMimeType: "application/json" },
    });

    const raw = result.response?.text?.() || "{}";
    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      console.error("translate-direct: JSON inválido (requestId=%s)", meta.requestId);
      // Registramos error sin gastar créditos
      await supabase.from("history").insert({
        user_id: user.id,
        source_lang: meta.source_lang,
        target_lang: meta.target_lang,
        roi_count: meta.roi_count,
        char_count: 0,
        provider: "gemini-multi",
        model: MODEL_NAME,
        status: "error",
        error: "Gemini (multimodal) no devolvió JSON válido",
        request_id: meta.requestId,
      });
      return NextResponse.json({ error: "Gemini no devolvió JSON válido" }, { status: 502 });
    }

    const outMap = new Map<string, string>(
      (parsed?.items || []).map((x: any) => [String(x.id), (x.text || "").replace(/\s+/g, " ").trim()])
    );
    const translated = crops.map((c) => ({ id: c.id, text: outMap.get(String(c.id)) || "" }));

    // Guardar historial + cobrar (nota: src vacío porque no hicimos OCR de texto)
    const histItems = translated.map((t) => ({
      roiId: t.id,
      bbox: null,
      src: "",                 // no hubo OCR textual
      dst: t.text,
    }));

    const { error: rpcError } = await supabase.rpc("spend_credits_and_log", {
      p_user_id: user.id,
      p_needed: needed,
      p_source_lang: meta.source_lang,
      p_target_lang: meta.target_lang,
      p_items: histItems,
      p_roi_count: meta.roi_count,
      p_char_count: translated.reduce((a, it) => a + (it.text?.length || 0), 0),
      p_provider: "gemini-multi",
      p_model: MODEL_NAME,
      p_cost_cents: 0,
      p_request_id: meta.requestId,
      p_status: "ok",
      p_error: null,
    });

    if (rpcError) {
      const m = rpcError.message?.toLowerCase() || "";
      const message =
        m.includes("insufficient") ? "Créditos insuficientes" :
        m.includes("daily quota") ? "Límite diario alcanzado" :
        rpcError.message || "RPC error";
      return NextResponse.json({ error: message }, {
        status: 402,
        headers: ratelimitHeaders(hitUser.remaining, hitUser.resetAt),
      });
    }

    return NextResponse.json({ items: translated }, {
      headers: ratelimitHeaders(hitUser.remaining, hitUser.resetAt),
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message || "Error en servidor" }, { status: 500 });
  }
}
