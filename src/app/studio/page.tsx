// src/app/studio/page.tsx
"use client";

import { useCallback, useMemo, useState } from "react";
import Dropzone from "react-dropzone";
import toast, { Toaster } from "react-hot-toast";
import AnnotatorSelect, { ROI } from "@/components/AnnotatorSelect";
import { buildRoiMosaicOneColumn, normalizeJa, postGlossaryEs } from "@/lib/mosaic";

type TransItem = { id: number; text: string };

type Phase =
  | "idle"
  | "validating"
  | "mosaic"
  | "ocr"
  | "grouping"
  | "translate"
  | "render";

const STAGE_W = 640;

const phaseLabel: Record<Phase, string> = {
  idle: "",
  validating: "Validando selección…",
  mosaic: "Armando mosaico…",
  ocr: "Leyendo texto (OCR)…",
  grouping: "Ordenando globos…",
  translate: "Traduciendo…",
  render: "Renderizando resultados…",
};

export default function Studio() {
  const [img, setImg] = useState<string>("");
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);
  const [rois, setRois] = useState<ROI[]>([]);
  const [translated, setTranslated] = useState<TransItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState<"ja" | "en">("ja");

  // progreso
  const [progress, setProgress] = useState<number>(0);
  const [phase, setPhase] = useState<Phase>("idle");

  // ✅ ahora mostramos la lista apenas haya elementos (aunque estén vacíos)
  const hasTranslation = translated.length > 0;

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
      setPhase("validating");
      setProgress(5);

      // 1) Mosaico (solo OCR→texto)
      setPhase("mosaic");
      setProgress(20);
      const { b64: sheetB64, cells } = await buildRoiMosaicOneColumn(
        img,
        rois,
        imgSize.w,
        STAGE_W,
        {
          cellW: 600,
          padding: 18,
          returnCrops: false,
        }
      );

      // 2) OCR del mosaico
      setPhase("ocr");
      setProgress(40);
      const ocrRes = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: sheetB64 }),
      });

      if (ocrRes.status === 422) {
        const payload = await ocrRes.json();
        toast.error(payload?.error || "No se detectó texto. No se descontaron créditos.");
        // Aun así, seguimos para poder mostrar ROIs vacíos
      } else {
        if (ocrRes.status === 401) {
          toast.error("Sesión expirada. Entrá de nuevo.");
          return;
        }
        if (ocrRes.status === 429) {
          toast.error("Demasiadas solicitudes. Probá en un minuto.");
          return;
        }
      }

      const ocr = await ocrRes.json().catch(() => ({ words: [] as any[] }));
      const words: { text: string; box: { x: number; y: number }[] }[] = ocr?.words || [];

      // 3) Agrupar palabras por celda
      setPhase("grouping");
      setProgress(55);
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

      // ✅ itemsAll (todos los ROIs seleccionados), aunque estén vacíos
      const itemsAll = cells.map((c) => ({
        id: c.id,
        text: normalizeJa((cellText[c.id] || []).join("")),
      }));

      // Para la API, solo mandamos los que tienen texto
      const itemsSrc = itemsAll.filter((i) => i.text.length > 0);

      // 4) Si no hubo NINGÚN texto, mostramos igual la lista vacía, sin llamar a la API
      if (itemsSrc.length === 0) {
        setTranslated(itemsAll.map(({ id }) => ({ id, text: "" })));
        setProgress(100);
        toast.error("No se reconoció texto en los globos seleccionados.");
        return;
      }

      // 5) Traducción
      setPhase("translate");
      setProgress(75);
      const requestId = crypto.randomUUID();
      const roiCount = itemsSrc.length; // 👈 sin cambios en facturación
      const charCount = itemsSrc.reduce((acc, it) => acc + it.text.length, 0);
      const sourceLang = from === "en" ? "en" : "ja";
      const targetLang = "es";

      const trRes = await fetch(`/api/translate-and-spend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meta: {
            requestId,
            source_lang: sourceLang,
            target_lang: targetLang,
            roi_count: roiCount, // 👈 seguimos enviando sólo los con texto
            char_count: charCount,
            image_w: imgSize.w,
            image_h: imgSize.h,
          },
          from,
          items: itemsSrc, // 👈 sólo con texto
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

      // 6) Render de resultados — ✅ mapeamos TODOS los ROIs,
      //    si uno no se mandó (sin texto), queda como "" y mostramos "(sin texto)"
      setPhase("render");
      setProgress(90);
      const outMap = new Map<string, string>(
        (tr.items || []).map((x: TransItem) => [String(x.id), x.text || ""])
      );
      const out: TransItem[] = itemsAll
        .map((it) => ({
          id: it.id,
          text: postGlossaryEs(outMap.get(String(it.id)) || ""), // puede quedar vacío
        }))
        .sort((a, b) => a.id - b.id);

      setTranslated(out);
      setProgress(100);
      toast.success("¡Listo!");
      window.dispatchEvent(new Event("credits:updated"));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Falló el proceso";
      toast.error(msg);
    } finally {
      setLoading(false);
      setTimeout(() => {
        setPhase("idle");
        setProgress(0);
      }, 600);
    }
  }

  const joined = useMemo(
    () =>
      translated
        .map((t) => `#${t.id} ${t.text || "(sin texto)"}`)
        .join("\n"),
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
                Dimensiones originales: {imgSize?.w} × {imgSize?.h}px — Seleccioná los globos en orden.
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
              disabled={loading}
            >
              <option value="ja">Japonés → Español</option>
              <option value="en">Inglés → Español</option>
            </select>
          </div>

          <button
            onClick={run}
            disabled={!img || !rois.length || loading}
            className="px-3 py-2 rounded bg-emerald-600 text-white disabled:opacity-50"
          >
            {loading ? "Procesando..." : "Traducir seleccionados"}
          </button>

          {/* Barra de progreso */}
          {loading && (
            <div className="w-full mt-3">
              <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
                <span>{phaseLabel[phase] || "Procesando…"}</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 w-full rounded bg-neutral-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-600 transition-[width] duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
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
                    className={`p-2 border rounded ${
                      t.text ? "bg-neutral-900 text-white border-neutral-700" : "bg-neutral-900/40 text-neutral-400 border-neutral-800"
                    }`}
                  >
                    {t.text || "(sin texto)"}
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
                  href={`data:text/plain;charset=utf-8,${encodeURIComponent(joined)}`}
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
