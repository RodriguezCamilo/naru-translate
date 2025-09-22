// src/lib/abuse.ts
type Strikes = { count: number; lastAt: number; blockedUntil?: number };

const STRIKE_WINDOW_MS = 10 * 60_000;   // 10 min para “consecutivos”
const MAX_STRIKES = 3;                  // a la 3ra: bloqueo
const BLOCK_MS = 30 * 60_000;           // 30 min de cooldown

const strikesByUser = new Map<string, Strikes>();

export function isBlocked(userId: string) {
  const now = Date.now();
  const s = strikesByUser.get(userId);
  if (!s) return { blocked: false as const, blockedUntil: 0 };
  if (s.blockedUntil && s.blockedUntil > now) {
    return { blocked: true as const, blockedUntil: s.blockedUntil };
  }
  return { blocked: false as const, blockedUntil: 0 };
}

export function noteEmptyOcr(userId: string) {
  const now = Date.now();
  const s = strikesByUser.get(userId);

  if (!s) {
    strikesByUser.set(userId, { count: 1, lastAt: now });
    return { count: 1, blockedUntil: 0 };
  }

  // si pasó mucho, reinicia la racha
  const consecutive = now - s.lastAt <= STRIKE_WINDOW_MS ? s.count + 1 : 1;
  s.count = consecutive;
  s.lastAt = now;

  if (consecutive >= MAX_STRIKES) {
    s.blockedUntil = now + BLOCK_MS;
    s.count = 0; // resetea la racha tras bloquear
    return { count: MAX_STRIKES, blockedUntil: s.blockedUntil };
  }

  return { count: consecutive, blockedUntil: 0 };
}

export function resetStrikes(userId: string) {
  const s = strikesByUser.get(userId);
  if (!s) return;
  s.count = 0;
  s.blockedUntil = undefined;
}
