// src/app/studio/page.tsx
"use client";

import { useCallback, useMemo, useState } from "react";
import Dropzone from "react-dropzone";
import toast, { Toaster } from "react-hot-toast";
import AnnotatorSelect, { ROI } from "@/components/AnnotatorSelect";
import {
  buildRoiMosaicOneColumn,
  normalizeJa,
  postGlossaryEs,
} from "@/lib/mosaic";

type TransItem = { id: number; text: string };
const STAGE_W = 640;

export default function Studio() {
  const [img, setImg] = useState<string>("");
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);
  const [rois, setRois] = useState<ROI[]>([]);
  const [translated, setTranslated] = useState<TransItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState<"ja" | "en">("ja");
  const [useDirectIA, setUseDirectIA] = useState(false);

  const hasTranslation = translated.some((t) => t.text);

  const onDrop = useCallback(async (files: File[]) => {
    const f = files?.[0];
    if (!f) return;
    const b64 = await fileToB64(f);
    const dims = await imgDims(b64);
    setImg(b64);
    setImgSize(dims);
    setRois([]);
    setTranslated([]);
    toast.success("Imagen cargada");
  }, []);

  function centroid(box: { x: number; y: number }[]) {
    const xs = box.map((b) => b.x),
      ys = box.map((b) => b.y);
    return {
      x: (Math.min(...xs) + Math.max(...xs)) / 2,
      y: (Math.min(...ys) + Math.max(...ys)) / 2,
    };
  }

  async function run() {
    try {
      if (!img || !imgSize || rois.length === 0) {
        toast.error("Subí una imagen y marcá al menos un globo");
        return;
      }
      setLoading(true);

      // 1) Construir mosaico (y opcionalmente crops para IA directa)
      const {
        b64: sheetB64,
        cells,
        crops,
      } = await buildRoiMosaicOneColumn(img, rois, imgSize.w, STAGE_W, {
        cellW: 600,
        padding: 18,
        returnCrops: useDirectIA, // ← si activaste IA directa, también devolvé crops
        cropMaxW: 768, // controla tamaño/costo de la IA
        cropFormat: "image/jpeg",
        cropJpegQuality: 0.85,
      });

      // === PIPELINE: IA DIRECTA POR ROIs (experimental) ===
      if (useDirectIA) {
        const requestId = crypto.randomUUID();
        const roiCount = crops?.length ?? 0;
        if (roiCount === 0) {
          toast.error("No se pudieron generar recortes para IA directa");
          return;
        }
        const sourceLang = from === "en" ? "en" : "ja";
        const targetLang = "es";

        const trRes = await fetch("/api/translate-direct", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            meta: {
              requestId,
              source_lang: sourceLang,
              target_lang: targetLang,
              roi_count: roiCount,
              image_w: imgSize.w,
              image_h: imgSize.h,
            },
            from,
            crops, // [{id, b64}]
          }),
        });

        if (trRes.status === 401) {
          toast.error("Sesión expirada. Entrá de nuevo.");
          return;
        }
        if (trRes.status === 429) {
          toast.error("Demasiadas solicitudes. Probá en un minuto.");
          return;
        }
        const tr = await trRes.json();
        if (tr.error) {
          toast.error(tr.error);
          return;
        }

        // Ordenar por id de ROI para que coincida con la UI
        const out: TransItem[] = rois
          .map((r) => {
            const hit = tr.items?.find(
              (x: TransItem) => String(x.id) === String(r.id)
            );
            return { id: r.id, text: postGlossaryEs(hit?.text || "") };
          })
          .sort((a, b) => a.id - b.id);

        setTranslated(out);
        toast.success("¡Listo (IA directa)!");
        window.dispatchEvent(new Event("credits:updated"));
        return;
      }

      // === PIPELINE CLÁSICO: OCR → IA TEXTO ===

      // 2) OCR del mosaico
      const ocrRes = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: sheetB64 }),
      });

      if (ocrRes.status === 422) {
        const payload = await ocrRes.json();
        toast.error(
          payload?.error || "No se detectó texto. No se descontaron créditos."
        );
        return;
      }
      
      if (ocrRes.status === 401) {
        toast.error("Sesión expirada. Entrá de nuevo.");
        return;
      }
      if (ocrRes.status === 429) {
        toast.error("Demasiadas solicitudes. Probá en un minuto.");
        return;
      }

      const ocr = await ocrRes.json();
      if (ocr.error) throw new Error(ocr.error);

      const words: { text: string; box: { x: number; y: number }[] }[] =
        ocr.words || [];
      const cellText: Record<number, string[]> = {};
      cells.forEach((c) => (cellText[c.id] = []));

      for (const w of words) {
        const c = centroid(w.box);
        const cell = cells.find(
          (cell) =>
            c.x >= cell.x &&
            c.x <= cell.x + cell.w &&
            c.y >= cell.y &&
            c.y <= cell.y + cell.h
        );
        if (cell) cellText[cell.id].push(w.text);
      }
      const itemsSrc = cells
        .map((c) => ({
          id: c.id,
          text: normalizeJa((cellText[c.id] || []).join("")),
        }))
        .filter((i) => i.text.length);

      if (!itemsSrc.length)
        throw new Error("No se reconoció texto en los globos.");

      // 3) Meta para backend (créditos)
      const requestId = crypto.randomUUID();
      const roiCount = itemsSrc.length;
      const charCount = itemsSrc.reduce((acc, it) => acc + it.text.length, 0);
      const sourceLang = from === "en" ? "en" : "ja";
      const targetLang = "es";

      // 4) Traducción + gasto (endpoint transaccional)
      const trRes = await fetch(`/api/translate-and-spend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meta: {
            requestId,
            source_lang: sourceLang,
            target_lang: targetLang,
            roi_count: roiCount,
            char_count: charCount,
            image_w: imgSize.w,
            image_h: imgSize.h,
          },
          from,
          items: itemsSrc, // [{id, text}]
        }),
      });

      if (trRes.status === 401) {
        toast.error("Sesión expirada. Entrá de nuevo.");
        return;
      }
      if (trRes.status === 429) {
        toast.error("Demasiadas solicitudes. Probá en un minuto.");
        return;
      }
      const tr = await trRes.json();
      if (tr.error) throw new Error(tr.error);

      const out: TransItem[] = itemsSrc
        .map((it) => {
          const hit = tr.items?.find(
            (x: TransItem) => String(x.id) === String(it.id)
          );
          return { id: it.id, text: postGlossaryEs(hit?.text || "") };
        })
        .sort((a, b) => a.id - b.id);

      setTranslated(out);
      toast.success("¡Listo!");
      window.dispatchEvent(new Event("credits:updated"));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Falló el proceso";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  const joined = useMemo(
    () => translated.map((t) => `#${t.id} ${t.text}`).join("\n"),
    [translated]
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 grid lg:grid-cols-[1fr,420px] gap-8">
      <Toaster />
      <div>
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-bold">Studio</h1>
        </div>

        {!img ? (
          <Dropzone accept={{ "image/*": [] }} multiple={false} onDrop={onDrop}>
            {({ getRootProps, getInputProps, isDragActive }) => (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer ${
                  isDragActive ? "bg-neutral-50" : ""
                }`}
              >
                <input {...getInputProps()} />
                <p className="text-sm text-neutral-600">
                  Arrastrá una imagen o hacé clic para subir
                </p>
              </div>
            )}
          </Dropzone>
        ) : (
          <>
            <div className="flex justify-between items-center mb-2 text-xs text-neutral-400">
              <span>
                Dimensiones originales: {imgSize?.w} × {imgSize?.h}px —
                Seleccioná los globos en orden.
              </span>
              <button
                onClick={() => {
                  setImg("");
                  setImgSize(null);
                  setRois([]);
                  setTranslated([]);
                }}
                className="px-2 py-1 rounded bg-red-600 text-white text-xs hover:bg-red-700"
              >
                Borrar imagen
              </button>
            </div>

            <div className="flex justify-center">
              <AnnotatorSelect
                img={img}
                naturalW={imgSize!.w}
                naturalH={imgSize!.h}
                stageWidth={STAGE_W}
                onChange={setRois}
              />
            </div>
          </>
        )}

        {/* Controles */}
        <div className="mt-4 flex flex-wrap justify-between gap-3">
          <div className="flex items-center gap-3">
            <select
              value={from}
              onChange={(e) => setFrom(e.target.value as any)}
              className="border rounded px-2 py-1 text-sm bg-neutral-900 border-neutral-800"
            >
              <option value="ja">Japonés → Español</option>
              <option value="en">Inglés → Español</option>
            </select>

            {/* Switch con tooltip bonito */}
            <div className="relative group flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useDirectIA}
                onChange={(e) => setUseDirectIA(e.target.checked)}
                className="cursor-pointer"
                id="directIA"
              />
              <label
                htmlFor="directIA"
                className="text-sm select-none cursor-pointer"
              >
                IA directa (sin OCR)
              </label>
              <div className="absolute bottom-full mb-2 hidden w-64 rounded-lg bg-neutral-900 text-white text-xs p-3 shadow-lg group-hover:block transition-opacity duration-200">
                <p className="font-semibold text-amber-400 mb-1">
                  ⚠️ Experimental
                </p>
                <p>
                  Este modo saltea el OCR: recorta cada globo y lo envía directo
                  a la IA. Puede mejorar calidad en algunos casos, pero su costo
                  es <span className="text-red-400 font-semibold">MUCHO</span>{" "}
                  mayor por globo (10 creditos).
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={run}
            disabled={!img || !rois.length || loading}
            className="px-3 py-2 rounded bg-emerald-600 text-white disabled:opacity-50"
          >
            {loading ? "Procesando..." : "Traducir seleccionados"}
          </button>
        </div>
      </div>

      {/* Panel derecho */}
      <aside className="space-y-6">
        <div className="p-4 border border-neutral-800 rounded-xl bg-neutral-950">
          <h2 className="font-semibold">Globos seleccionados</h2>
          {rois.length ? (
            <ul className="mt-2 text-sm space-y-1">
              {rois.map((r) => (
                <li key={r.id} className="flex justify-between">
                  <span>ROI #{r.id}</span>
                  <span className="opacity-60">
                    {Math.round(r.w)}×{Math.round(r.h)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-neutral-500">No hay selección.</p>
          )}
        </div>

        <div className="p-4 border border-neutral-800 rounded-xl bg-neutral-950">
          <h2 className="font-semibold">Traducción</h2>
          {hasTranslation ? (
            <>
              <ol className="mt-2 list-decimal ml-5 space-y-2 text-sm">
                {translated.map((t) => (
                  <li
                    key={t.id}
                    className="p-2 bg-neutral-900 text-white border border-neutral-700 rounded"
                  >
                    {t.text || "(vacío)"}
                  </li>
                ))}
              </ol>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => navigator.clipboard.writeText(joined)}
                  className="text-sm px-3 py-1.5 rounded border border-neutral-800"
                >
                  Copiar todo
                </button>
                <a
                  href={`data:text/plain;charset=utf-8,${encodeURIComponent(
                    joined
                  )}`}
                  download="traduccion.txt"
                  className="text-sm px-3 py-1.5 rounded border border-neutral-800"
                >
                  Descargar .txt
                </a>
              </div>
            </>
          ) : (
            <p className="mt-2 text-sm text-neutral-500">Aún sin traducción.</p>
          )}
        </div>
      </aside>
    </div>
  );
}

// helpers
async function fileToB64(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
function imgDims(b64: string): Promise<{ w: number; h: number }> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = rej;
    img.src = b64;
  });
}
