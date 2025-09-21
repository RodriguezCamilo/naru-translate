const WINDOW_MS = 60_000;   // 1 minuto
const MAX_REQS  = 60;       // 60 req/min (ajustá por endpoint)

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function allow(key: string, max = MAX_REQS, windowMs = WINDOW_MS) {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now > b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: max - 1, resetAt: now + windowMs };
  }
  if (b.count >= max) {
    return { ok: false, remaining: 0, resetAt: b.resetAt };
  }
  b.count++;
  return { ok: true, remaining: max - b.count, resetAt: b.resetAt };
}

export function ratelimitHeaders(remaining: number, resetAt: number) {
  return {
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": String(Math.ceil(resetAt / 1000)), // epoch seconds
  };
}
