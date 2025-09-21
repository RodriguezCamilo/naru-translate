// src/components/CreditsBadge.tsx
"use client";
import useSWR from "swr";
import { useEffect } from "react";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function CreditsBadge({ initial }: { initial: number | null }) {
  const { data, mutate, isLoading } = useSWR("/api/me/credits", fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    // Hacemos “seed” con el valor SSR para evitar parpadeo
    fallbackData: initial == null ? undefined : { credits: initial },
  });

  // Escucha un evento global para refrescar inmediatamente tras una compra/uso
  useEffect(() => {
    const h = () => { void mutate(); };
    window.addEventListener("credits:updated", h);
    return () => window.removeEventListener("credits:updated", h);
  }, [mutate]);

  const val = data?.credits;
  if (val == null && isLoading) return null;

  return (
    <span className="text-xs px-2 py-1 rounded border border-neutral-800 bg-neutral-900">
      Créditos: <b>{val ?? 0}</b>
    </span>
  );
}
