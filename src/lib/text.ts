// Normalizaciones ligeras y utilidades JA/ES

export function normalizeJa(s: string) {
  return s
    .replace(/[･•·●◦・]+/g, "・")
    .replace(/[。]{2,}/g, "。")
    .replace(/\s+/g, " ")
    .replace(/\u3000/g, " ") // espacio japonés
    .trim();
}

// divide por signos fuertes y conserva el delimitador
export function splitSentencesJa(s: string): string[] {
  const cleaned = normalizeJa(s);
  const parts = cleaned.split(/(?<=[。！？!?])/);
  return parts.map(p => p.trim()).filter(Boolean);
}

// congela nombres en katakana (opcional: honoríficos)
type FreezeResult = { text: string; slots: string[] };
export function freezeKatakanaNames(s: string): FreezeResult {
  const slots: string[] = [];
  // Katakana 2+ chars + honoríficos comunes opcionales
  const re = /([ァ-ヴー]{2,}(?:さん|ちゃん|くん|様)?)/g;
  const text = s.replace(re, (_m, g1) => {
    const id = slots.push(g1) - 1;
    return `__KEEP_${id}__`;
  });
  return { text, slots };
}

export function unfreezeSlotsEs(s: string, slots: string[]): string {
  return s.replace(/__KEEP_(\d+)__/g, (_m, n) => slots[Number(n)] ?? "");
}

// post en español (suave)
export function postEs(s: string) {
  return s
    .replace(/\s+/g, " ")
    .replace(/\s([,.;!?])/g, "$1")
    .replace(/``|''/g, '"')
    .trim();
}

export function preProcessJaForMT(s: string) {
  // por ahora: solo normalizar; si quisieras, podés join por líneas con '。'
  return normalizeJa(s);
}
