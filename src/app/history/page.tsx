"use client";

import useSWR from "swr";
import { useState } from "react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function HistoryPage() {
  const [page, setPage] = useState(1);
  const { data, error, isLoading } = useSWR(`/api/history?page=${page}`, fetcher);

  if (error) return <div className="p-6 text-red-500">Error: {error.message}</div>;
  if (isLoading) return <div className="p-6">Cargando…</div>;

  const { items, total, perPage } = data;
  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 space-y-6">
      <h1 className="text-2xl font-bold">Historial</h1>

      {!items?.length ? (
        <p className="text-sm text-neutral-400">Aún no hay traducciones.</p>
      ) : (
        <div className="space-y-4">
          {items.map((row: any) => (
            <div key={row.id} className="p-4 border border-neutral-800 rounded-xl bg-neutral-950">
              <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-400">
                <span>{new Date(row.created_at).toLocaleString()}</span>
                <span>· {row.source_lang.toUpperCase()} → {row.target_lang.toUpperCase()}</span>
                <span>· Globos: {row.roi_count}</span>
                <span>· Chars: {row.char_count}</span>
              </div>

              <ol className="mt-3 list-decimal ml-5 space-y-2 text-sm">
                {row.items?.slice(0, 6)?.map((it: any) => (
                  <li key={it.roiId ?? it.id} className="p-2 bg-neutral-900 border border-neutral-800 rounded">
                    {it?.dst || it?.text || "(vacío)"}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1 rounded border disabled:opacity-50"
          >
            ← Anterior
          </button>
          <span className="text-sm">Página {page} de {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1 rounded border disabled:opacity-50"
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
}
