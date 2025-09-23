import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createSupabaseServer } from "@/lib/supabase-server";
import { allow, ratelimitHeaders } from "@/lib/ratelimit";
import { getClientIp } from "@/lib/get-ip";

const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_KEY || "";
export const runtime = "nodejs";

// 🔒 Modelo fijo (no modificable desde el cliente)
const MODEL_NAME = "gemini-2.5-pro";

// 💳 Costo base por ROI para OCR→texto (ajustable por ENV)
const BASE_CREDITS_PER_ROI = Number(process.env.CREDITS_PER_ROI_TEXT || 1);

type Item = { id: number | string; text: string };
type Meta = {
  requestId: string;
  source_lang: string;
  target_lang: string;
  roi_count: number;
  char_count: number;
  image_w?: number;
  image_h?: number;
};

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const ip = getClientIp(req);
    const hitUser = allow(`tls:${user.id}`, 60, 60_000);
    const hitIp   = allow(`ip:${ip}`,       120, 60_000);
    if (!hitUser.ok || !hitIp.ok) {
      const headers = ratelimitHeaders(Math.min(hitUser.remaining, hitIp.remaining), Math.max(hitUser.resetAt, hitIp.resetAt));
      return new NextResponse(JSON.stringify({ error: "Too Many Requests" }), { status: 429, headers });
    }

    const body = (await req.json()) as {
      items: Item[];
      meta: Meta;
      from: "ja" | "en";
      // model?: string; // ❌ ignorado a propósito
    };
    const { items, meta, from } = body;

    if (!items?.length || !meta?.requestId) {
      return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
    }
    if ((meta.char_count ?? 0) === 0) {
      return NextResponse.json({ error: "Texto vacío. No se descontaron créditos." }, { status: 422 });
    }
    if (!GEMINI_KEY) {
      return NextResponse.json({ error: "Falta GEMINI_API_KEY" }, { status: 500 });
    }

    if (meta.roi_count > 64) return NextResponse.json({ error: "Demasiados globos en un solo pedido" }, { status: 413 });
    if (meta.char_count > 8000) return NextResponse.json({ error: "Texto demasiado largo" }, { status: 413 });

    // 🧮 Créditos: base * #ROIs (modelo fijo)
    const needed = BASE_CREDITS_PER_ROI * meta.roi_count;

    // --- Gemini ---
    const numbered = items.map((it) => `id=${it.id} :: ${it.text}`).join("\n");
    const systemPrompt = `
Eres un traductor profesional de manga.
Traduce cada fragmento del ${from === "en" ? "inglés" : "japonés"} al español neutro latinoamericano.
- Sé natural y conversacional.
- No dejes palabras en ${from === "en" ? "inglés" : "japonés"}.
- Nombres propios: usa la forma más conocida en español si existe; si no, transcribe a romaji.
Devuelve SOLO JSON:
{"items":[{"id":"<id>","text":"<es>"}]}
`.trim();

    const genAI = new GoogleGenerativeAI(GEMINI_KEY);
    const modelClient = genAI.getGenerativeModel({ model: MODEL_NAME });
    const result = await modelClient.generateContent({
      contents: [
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "user", parts: [{ text: numbered }] },
      ],
      generationConfig: { temperature: 0.2, responseMimeType: "application/json" },
    });

    const raw = result.response?.text?.() || "{}";
    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      await supabase.from("history").insert({
        user_id: user.id,
        source_lang: meta.source_lang,
        target_lang: meta.target_lang,
        roi_count: meta.roi_count,
        char_count: meta.char_count,
        provider: "gemini",
        model: MODEL_NAME,
        status: "error",
        error: "Gemini no devolvió JSON válido",
        request_id: meta.requestId,
      });
      return NextResponse.json({ error: "Gemini no devolvió JSON válido" }, { status: 502 });
    }

    const outMap = new Map<string, string>(
      (parsed?.items || []).map((x: any) => [String(x.id), (x.text || "").replace(/\s+/g, " ").trim()])
    );
    const translated = items.map((it) => ({ id: it.id, text: outMap.get(String(it.id)) || "" }));

    const histItems = items.map((it) => ({
      roiId: it.id,
      bbox: null,
      src: it.text,
      dst: outMap.get(String(it.id)) || "",
    }));

    const { error: rpcError } = await supabase.rpc("spend_credits_and_log", {
      p_user_id: user.id,
      p_needed: needed,
      p_source_lang: meta.source_lang,
      p_target_lang: meta.target_lang,
      p_items: histItems,
      p_roi_count: meta.roi_count,
      p_char_count: meta.char_count,
      p_provider: "gemini",
      p_model: MODEL_NAME,   // 🔒 siempre guardamos el fijo
      p_cost_cents: 0,
      p_request_id: meta.requestId,
      p_status: "ok",
      p_error: null,
    });

    if (rpcError) {
      const message = rpcError.message?.toLowerCase().includes("insufficient")
        ? "Créditos insuficientes"
        : rpcError.message || "RPC error";
      return NextResponse.json(
        { error: message },
        { status: 402, headers: ratelimitHeaders(hitUser.remaining, hitUser.resetAt) }
      );
    }

    return NextResponse.json(
      { items: translated },
      { headers: ratelimitHeaders(hitUser.remaining, hitUser.resetAt) }
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error en servidor";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
