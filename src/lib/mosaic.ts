export type ROI = { id: number; x: number; y: number; w: number; h: number };

export type MosaicCell = {
  idx: number; // 0..n-1
  id: number;  // id del ROI original
  x: number;   // en el canvas del mosaico
  y: number;
  w: number;
  h: number;
};

export type RoiCrop = { id: number; b64: string }; // recorte por ROI para IA directa

export async function buildRoiMosaicOneColumn(
  imgB64: string,
  rois: ROI[],
  naturalW: number,
  stageWidth: number,
  opts?: {
    cellW?: number;
    padding?: number;
    /** si true, devuelve también recortes por ROI sacados de la imagen original */
    returnCrops?: boolean;
    /** ancho máximo de cada crop (para limitar tamaño/costo); default 768 */
    cropMaxW?: number;
    /** formato de salida para crops (image/png|image/jpeg); default image/png */
    cropFormat?: "image/png" | "image/jpeg";
    /** calidad JPEG 0..1 si usás image/jpeg */
    cropJpegQuality?: number;
  }
): Promise<{
  b64: string;         // mosaico
  cells: MosaicCell[]; // geometría exacta de cada parche en el mosaico
  crops?: RoiCrop[];   // opcional: recortes por ROI
}> {
  const cellW = opts?.cellW ?? 600;
  const padding = opts?.padding ?? 18;
  const cropMaxW = opts?.cropMaxW ?? 768;
  const cropFormat = opts?.cropFormat ?? "image/png";
  const cropJpegQuality = opts?.cropJpegQuality ?? 0.9;

  const img = await loadImage(imgB64);
  const scale = stageWidth / naturalW;

  // Llevar ROIs a coords originales + calcular alto manteniendo aspecto
  const patches = rois.map((r, i) => {
    const rx = r.x / scale, ry = r.y / scale, rw = r.w / scale, rh = r.h / scale;
    const ch = Math.max(1, Math.round((rh / rw) * cellW));
    return { id: r.id, idx: i, sx: rx, sy: ry, sw: rw, sh: rh, cw: cellW, ch };
  });

  // Canvas del mosaico
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

  // Opcional: crops por ROI sacados de la imagen original (no del mosaico)
  let crops: RoiCrop[] | undefined;
  if (opts?.returnCrops) {
    crops = patches.map((p) => {
      const outW = Math.min(cropMaxW, Math.max(1, Math.round(p.sw)));
      const outH = Math.max(1, Math.round((p.sh / p.sw) * outW));
      const c = document.createElement("canvas");
      c.width = outW;
      c.height = outH;
      const cctx = c.getContext("2d")!;
      cctx.drawImage(img, p.sx, p.sy, p.sw, p.sh, 0, 0, outW, outH);
      const b64 =
        cropFormat === "image/jpeg"
          ? c.toDataURL("image/jpeg", cropJpegQuality)
          : c.toDataURL("image/png");
      return { id: p.id, b64 };
    });
  }

  return { b64: canvas.toDataURL("image/png"), cells, crops };
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
