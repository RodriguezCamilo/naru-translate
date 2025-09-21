export type ROI = { id: number; x: number; y: number; w: number; h: number };

export type MosaicCell = {
  idx: number;      // 0..n-1
  id: number;       // id del ROI original
  x: number;        // en el canvas del mosaico
  y: number;
  w: number;
  h: number;
};

export async function buildRoiMosaicOneColumn(
  imgB64: string,
  rois: ROI[],
  naturalW: number,
  stageWidth: number,
  opts?: { cellW?: number; padding?: number }
): Promise<{
  b64: string;
  cells: MosaicCell[];                 // geometría exacta de cada parche
}> {
  const cellW = opts?.cellW ?? 600;
  const padding = opts?.padding ?? 18;

  const img = await loadImage(imgB64);
  const scale = stageWidth / naturalW;

  // llevar ROIs a coords originales + calcular alto manteniendo aspecto
  const patches = rois.map((r, i) => {
    const rx = r.x / scale, ry = r.y / scale, rw = r.w / scale, rh = r.h / scale;
    const ch = Math.max(1, Math.round((rh / rw) * cellW));
    return { id: r.id, idx: i, sx: rx, sy: ry, sw: rw, sh: rh, cw: cellW, ch };
  });

  const sheetW = cellW + padding * 2;
  const sheetH = padding + patches.reduce((a, p) => a + p.ch + padding, 0);

  const canvas = document.createElement("canvas");
  canvas.width = sheetW;
  canvas.height = sheetH;
  const ctx = canvas.getContext("2d")!;

  // fondo blanco
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, sheetW, sheetH);

  const cells: MosaicCell[] = [];
  let y = padding;

  patches.forEach((p) => {
    const x = padding;
    ctx.drawImage(img, p.sx, p.sy, p.sw, p.sh, x, y, p.cw, p.ch);
    cells.push({ idx: p.idx, id: p.id, x, y, w: p.cw, h: p.ch });
    y += p.ch + padding;
  });

  return { b64: canvas.toDataURL("image/png"), cells };
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

/* --- normalización genérica --- */
export function normalizeJa(s: string) {
  return s
    .replace(/[･•·●◦・]+/g, "・")
    .replace(/[。]{2,}/g, "。")
    .replace(/\s+/g, " ")
    .trim();
}

export function postGlossaryEs(s: string) {
  return s.replace(/\s+/g, " ").trim();
}
