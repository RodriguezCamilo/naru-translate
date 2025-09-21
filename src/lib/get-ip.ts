import type { NextRequest } from "next/server";

function firstIpFromList(list: string | null): string | null {
  if (!list) return null;
  // x-forwarded-for puede venir como "client, proxy1, proxy2"
  const first = list.split(",")[0]?.trim();
  return first || null;
}

export function getClientIp(req: NextRequest): string {
  // Prioridades comunes en PaaS/CDN/proxy
  const fromXff = firstIpFromList(req.headers.get("x-forwarded-for"));
  const fromCf = req.headers.get("cf-connecting-ip");
  const fromXri = req.headers.get("x-real-ip");
  const fromXci = req.headers.get("x-client-ip");

  return (
    fromXff ||
    fromCf ||
    fromXri ||
    fromXci ||
    "unknown" // fallback en dev/local
  );
}
