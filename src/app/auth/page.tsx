"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

// evita prerender estático
export const dynamic = "force-dynamic";

function AuthInner() {
  const sp = useSearchParams();
  const redirect = sp.get("redirect") || "/studio";
  const supabase = createSupabaseBrowser();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");

  const emailRedirectTo = useMemo(() => {
    // redirige a /auth con redirect param después de confirmar el email
    if (typeof window === "undefined") return undefined;
    const base = window.location.origin;
    return `${base}/auth?redirect=${encodeURIComponent(redirect)}`;
  }, [redirect]);

  // si ya hay sesión, afuera
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) window.location.href = redirect;
    })();
  }, [redirect, supabase]);

  async function submit() {
    setErr("");
    setInfo("");
    try {
      if (!email) throw new Error("Ingresá tu email.");
      if (mode === "signup" && pass.length < 6) {
        throw new Error("La contraseña debe tener al menos 6 caracteres.");
      }

      if (mode === "signup") {
        // Registro con verificación por email
        const { error } = await supabase.auth.signUp({
          email,
          password: pass,
          options: {
            emailRedirectTo, // vuelve acá tras confirmar
          },
        });
        if (error) throw error;

        setInfo(
          "Te enviamos un correo para confirmar la cuenta. Revisá tu bandeja (y spam)."
        );
        setPass("");
        return;
      }

      // Login con usuario/contraseña
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });
      if (error) throw error;

      window.location.href = redirect;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error";
      setErr(msg);
    }
  }

  async function sendMagicLink() {
    setErr("");
    setInfo("");
    try {
      if (!email) throw new Error("Ingresá tu email.");
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo,
        },
      });
      if (error) throw error;
      setInfo("Te mandamos un link mágico a tu correo.");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error";
      setErr(msg);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold">Bienvenido a NaruTrad</h1>
      <div className="mt-3 inline-flex rounded-lg border border-neutral-800 overflow-hidden">
        <button
          onClick={() => setMode("login")}
          className={`px-4 py-2 text-sm ${
            mode === "login" ? "bg-neutral-800 text-white" : "text-neutral-300"
          }`}
        >
          Iniciar sesión
        </button>
        <button
          onClick={() => setMode("signup")}
          className={`px-4 py-2 text-sm ${
            mode === "signup" ? "bg-neutral-800 text-white" : "text-neutral-300"
          }`}
        >
          Crear cuenta
        </button>
      </div>

      <p className="text-sm text-neutral-400 mt-4">
        {mode === "login" ? "Entrá con tu cuenta" : "Registrate con tu correo"}
      </p>

      <div className="mt-6 space-y-3">
        <input
          className="w-full border rounded px-3 py-2 bg-black/40 text-white placeholder:text-neutral-500"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          autoComplete="email"
        />

        <div className="flex gap-2">
          <input
            className="w-full border rounded px-3 py-2 bg-black/40 text-white placeholder:text-neutral-500"
            placeholder={mode === "login" ? "Contraseña" : "Elige una contraseña"}
            type={showPass ? "text" : "password"}
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
          <button
            type="button"
            onClick={() => setShowPass((s) => !s)}
            className="px-3 py-2 text-xs border rounded hover:bg-neutral-900"
          >
            {showPass ? "Ocultar" : "Ver"}
          </button>
        </div>

        {err && <div className="text-sm text-red-500">{err}</div>}
        {info && <div className="text-sm text-emerald-400">{info}</div>}

        <button
          onClick={submit}
          className="w-full px-4 py-2 rounded bg-emerald-600 text-white"
        >
          {mode === "login" ? "Entrar" : "Crear cuenta"}
        </button>

        <button
          type="button"
          onClick={sendMagicLink}
          className="w-full px-4 py-2 rounded border border-neutral-700 hover:bg-neutral-900 text-sm"
        >
          {mode === "login" ? "Entrar con link mágico" : "Registrarme con link mágico"}
        </button>

        {mode === "login" && (
          <button
            type="button"
            onClick={() => setMode("signup")}
            className="w-full text-xs text-neutral-400 hover:text-neutral-200"
          >
            ¿No tenés cuenta? Crear cuenta
          </button>
        )}
        {mode === "signup" && (
          <button
            type="button"
            onClick={() => setMode("login")}
            className="w-full text-xs text-neutral-400 hover:text-neutral-200"
          >
            ¿Ya tenés cuenta? Iniciar sesión
          </button>
        )}
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="p-10">Cargando…</div>}>
      <AuthInner />
    </Suspense>
  );
}
