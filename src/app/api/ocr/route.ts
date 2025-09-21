// src/app/api/ocr/route.ts
import { NextRequest, NextResponse } from "next/server";
import { visionClient } from "@/lib/google";
import { createSupabaseServer } from "@/lib/supabase-server";
import { allow, ratelimitHeaders } from "@/lib/ratelimit";
import { getClientIp } from "@/lib/get-ip";

export const runtime = "nodejs";
const MAX_BASE64_CHARS = 6_500_000; // ~5MB binarios aprox

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const ip = getClientIp(req);
    const hitUser = allow(`ocr:${user.id}`, 30, 60_000);
    const hitIp   = allow(`ip:${ip}`,      60, 60_000);
    if (!hitUser.ok || !hitIp.ok) {
      const headers = ratelimitHeaders(
        Math.min(hitUser.remaining, hitIp.remaining),
        Math.max(hitUser.resetAt, hitIp.resetAt)
      );
      return new NextResponse(JSON.stringify({ error: "Too Many Requests" }), { status: 429, headers });
    }

    const { imageBase64 } = (await req.json()) as { imageBase64: string };
    if (!imageBase64) {
      return NextResponse.json({ error: "imageBase64 required" }, { status: 400 });
    }

    const base64Data = (imageBase64.split(",").pop() || imageBase64).trim();

    if (base64Data.length > MAX_BASE64_CHARS) {
      return NextResponse.json({ error: "Imagen demasiado grande" }, {
        status: 413,
        headers: ratelimitHeaders(hitUser.remaining, hitUser.resetAt),
      });
    }

    const [result] = await visionClient.documentTextDetection({
      image: { content: Buffer.from(base64Data, "base64") },
      imageContext: { languageHints: ["ja"] },
    });

    const ann = result.fullTextAnnotation;
    const fullText = ann?.text || "";
    const words: { text: string; box: { x: number; y: number }[] }[] = [];

    for (const page of ann?.pages ?? []) {
      for (const block of page.blocks ?? []) {
        for (const par of block.paragraphs ?? []) {
          for (const w of par.words ?? []) {
            const t = (w.symbols ?? []).map((s) => s.text).join("");
            const box = (w.boundingBox?.vertices ?? []).map((v) => ({
              x: v.x || 0,
              y: v.y || 0,
            }));
            if (t.trim()) words.push({ text: t, box });
          }
        }
      }
    }

    return NextResponse.json({ fullText, words }, {
      headers: ratelimitHeaders(hitUser.remaining, hitUser.resetAt),
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "OCR failed" }, { status: 500 });
  }
}
