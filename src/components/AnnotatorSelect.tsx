"use client";

import { Stage, Layer, Rect, Text, Image as KonvaImage } from "react-konva";
import useImage from "use-image";
import { useMemo, useRef, useState, useEffect } from "react";

export type ROI = { id: number; x: number; y: number; w: number; h: number };

export default function AnnotatorSelect({
  img,
  naturalW,
  naturalH,
  stageWidth = 600,
  onChange,
}: {
  img: string;
  naturalW: number;
  naturalH: number;
  stageWidth?: number;
  onChange?: (rois: ROI[]) => void;
}) {
  const [rois, setRois] = useState<ROI[]>([]);
  const [drawing, setDrawing] = useState<ROI | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const idRef = useRef(1);

  const { scale, stageH } = useMemo(() => {
    const s = stageWidth / naturalW;
    return { scale: s, stageH: Math.round(naturalH * s) };
  }, [stageWidth, naturalW, naturalH]);

  const onMouseDown = (e: any) => {
    const pos = e.target.getStage().getPointerPosition();
    // si clickea un ROI existente -> seleccionar
    const hit = rois.find(
      (r) =>
        pos.x >= r.x && pos.x <= r.x + r.w && pos.y >= r.y && pos.y <= r.y + r.h
    );
    if (hit) {
      setSelectedId(hit.id);
      return;
    }
    // si no, empezar a dibujar
    setSelectedId(null);
    setDrawing({ id: idRef.current, x: pos.x, y: pos.y, w: 0, h: 0 });
  };
  const onMouseMove = (e: any) => {
    if (!drawing) return;
    const pos = e.target.getStage().getPointerPosition();
    setDrawing({ ...drawing, w: pos.x - drawing.x, h: pos.y - drawing.y });
  };
  const onMouseUp = () => {
    if (!drawing) return;
    const r = normalizeRect(drawing);
    if (r.w > 4 && r.h > 4)
      setRois((prev) => [...prev, { ...r, id: idRef.current++ }]);
    setDrawing(null);
  };

  // borrar con teclado
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (
        (ev.key === "Delete" || ev.key === "Backspace") &&
        selectedId != null
      ) {
        setRois((prev) => prev.filter((r) => r.id !== selectedId));
        setSelectedId(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId]);

  // emitir rois al padre
  useEffect(() => {
    onChange?.(rois);
  }, [rois, onChange]);

  return (
    <div className="space-y-2">
      <Stage
        width={stageWidth}
        height={stageH}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        className="border border-neutral-800 rounded bg-neutral-900"
      >
        <Layer>
          <BgImage src={img} width={stageWidth} height={stageH} />
          {rois.map((r) => (
            <Rect
              key={r.id}
              x={r.x}
              y={r.y}
              width={r.w}
              height={r.h}
              stroke={selectedId === r.id ? "#10b981" : "red"}
              strokeWidth={selectedId === r.id ? 3 : 2}
              dash={selectedId === r.id ? undefined : [4, 4]}
              onClick={() => setSelectedId(r.id)}
            />
          ))}
          {rois.map((r) => (
            <Text
              key={`t${r.id}`}
              x={r.x + 4}
              y={r.y + 4}
              text={`${r.id}`}
              fontStyle="bold"
              fill={selectedId === r.id ? "#10b981" : "#111827"}
            />
          ))}
          {drawing && (
            <Rect
              x={drawing.x}
              y={drawing.y}
              width={drawing.w}
              height={drawing.h}
              stroke="orange"
              strokeWidth={2}
              dash={[2, 2]}
            />
          )}
        </Layer>
      </Stage>
      <div className="flex gap-2">
        <button
          onClick={() => {
            if (selectedId == null) return;
            setRois((prev) => prev.filter((r) => r.id !== selectedId));
            setSelectedId(null);
          }}
          className="text-sm px-3 py-1 border rounded hover:bg-neutral-50 disabled:opacity-50"
          disabled={selectedId == null}
        >
          Borrar seleccionado
        </button>
        <button
          onClick={() => {
            setRois([]);
            setSelectedId(null);
          }}
          className="text-sm px-3 py-1 border rounded hover:bg-neutral-50"
        >
          Limpiar todo
        </button>
      </div>
    </div>
  );
}

function normalizeRect(r: ROI) {
  const nx = r.w < 0 ? r.x + r.w : r.x;
  const ny = r.h < 0 ? r.y + r.h : r.y;
  return { ...r, x: nx, y: ny, w: Math.abs(r.w), h: Math.abs(r.h) };
}

function BgImage({
  src,
  width,
  height,
}: {
  src: string;
  width: number;
  height: number;
}) {
  const [image] = useImage(src);
  if (!image) return null;
  return <KonvaImage image={image} width={width} height={height} />;
}
