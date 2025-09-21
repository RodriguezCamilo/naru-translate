"use client";
import { useEffect, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

export function LogoutButton() {
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowser();

    // estado inicial
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(!!data.session);
    });

    // suscripción a cambios
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      setHasSession(!!session);
    });

    return () => {
      sub?.subscription.unsubscribe();
    };
  }, []);

  if (!hasSession) return null;

  return (
    <button
      onClick={async () => {
        const supabase = createSupabaseBrowser();
        await supabase.auth.signOut();
        window.location.href = "/";
      }}
      className="text-sm px-3 py-1.5 rounded border border-neutral-700 hover:bg-neutral-900"
      title="Cerrar sesión"
    >
      Salir
    </button>
  );
}
