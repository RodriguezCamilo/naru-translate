"use client";

import Link from "next/link";
import { useState } from "react";

// --- Minimal icon set (no deps) ---
function Check() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5">
      <path d="M20 7L10 17l-6-6" className="stroke-current" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}
function Sparkle() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5">
      <path d="M12 2l1.8 4.7L18 8.7l-4.2 2 .9 4.9L12 13.7 7.3 15.6l.9-4.9L4 8.7l4.2-2L12 2z" className="fill-current" />
    </svg>
  );
}
function Cursor() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5">
      <path d="M4 3l8 18 2-8 8-2L4 3z" className="fill-current" />
    </svg>
  );
}
function Clock() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5">
      <path d="M12 6v6l4 2" className="stroke-current" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="12" cy="12" r="9" className="stroke-current" strokeWidth={2} fill="none" />
    </svg>
  );
}
function Bolt() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" className="fill-current" />
    </svg>
  );
}

// --- AppPreview (mock UI) ---
function AppPreview() {
  const [step, setStep] = useState<0 | 1 | 2>(2);
  return (
    <div className="relative w-full aspect-[16/10] rounded-2xl border border-neutral-800 bg-neutral-950 overflow-hidden">
      {/* header */}
      <div className="flex items-center justify-between px-4 h-10 border-b border-neutral-800 bg-neutral-900/50">
        <div className="text-xs text-neutral-300">NaruTrad Studio</div>
        <div className="flex gap-2 text-[10px] text-neutral-400">
          <div className="px-2 py-0.5 rounded bg-neutral-800/60">JA→ES</div>
          <div className="px-2 py-0.5 rounded bg-neutral-800/60">EN→ES</div>
          <div className="px-2 py-0.5 rounded bg-neutral-800/60">Vision OCR</div>
          <div className="px-2 py-0.5 rounded bg-neutral-800/60">Gemini Flash</div>
        </div>
      </div>

      <div className="grid grid-cols-12 h-[calc(100%-2.5rem)]">
        {/* canvas */}
        <div className="col-span-8 relative p-3 bg-neutral-950">
          <div className="relative mx-auto h-full max-h-[420px] aspect-[3/4] bg-neutral-900 rounded-lg border border-neutral-800 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-neutral-800/40 via-neutral-900/40 to-neutral-950" />
            <div className="absolute left-[12%] top-[14%] w-[58%] h-[18%] border-2 border-emerald-500/80 rounded-lg" />
            <div className="absolute left-[10%] top-[40%] w-[70%] h-[16%] border-2 border-emerald-500/50 rounded-lg" />
            <div className="absolute right-[10%] bottom-[18%] w-[55%] h-[20%] border-2 border-emerald-500/50 rounded-lg" />
            <div className="absolute -right-6 bottom-10 rotate-12 opacity-70">
              <div className="flex items-center gap-2 text-xs text-neutral-300 bg-neutral-900/70 border border-neutral-800 px-2 py-1 rounded-md">
                <Cursor /> Dibujá un rectángulo
              </div>
            </div>
          </div>
        </div>
        {/* side */}
        <div className="col-span-4 border-l border-neutral-800 bg-neutral-950">
          <div className="h-full p-3 flex flex-col gap-3">
            <div className="text-xs text-neutral-400">Flujo</div>
            <div className="space-y-2">
              {[
                { t: "1) Subí la página", d: "JPG/PNG." },
                { t: "2) Marcá los globos", d: "Orden de lectura bajo control." },
                { t: "3) Traducí", d: "OCR + IA en segundos." },
              ].map((s, i) => (
                <button key={i} onClick={() => setStep(i as 0 | 1 | 2)} className={`w-full text-left px-3 py-2 rounded-md border text-sm transition ${step === i ? "border-emerald-600 bg-emerald-600/10 text-emerald-300" : "border-neutral-800 hover:border-neutral-700 text-neutral-300"}`}>
                  <div className="font-medium">{s.t}</div>
                  <div className="text-xs text-neutral-400">{s.d}</div>
                </button>
              ))}
            </div>
            <div className="mt-2 text-xs text-neutral-400">Vista previa</div>
            <div className="flex-1 min-h-0 overflow-auto rounded-lg border border-neutral-800 bg-neutral-900/40 p-3 text-sm">
              {step === 0 && <p className="text-neutral-300">Arrastrá tu imagen al canvas.</p>}
              {step === 1 && <p className="text-neutral-300">Globos #1, #2, #3 listos. Reordená y editá.</p>}
              {step === 2 && (
                <div className="space-y-2">
                  <div className="text-neutral-500">#1</div>
                  <div className="bg-neutral-800/60 rounded p-2">
                    <div className="text-xs text-neutral-400">OCR</div>
                    <div>……大丈夫、任せて。</div>
                    <div className="text-xs text-neutral-400 mt-2">ES</div>
                    <div>Tranquilo, déjamelo a mí.</div>
                  </div>
                  <div className="text-neutral-500">#2</div>
                  <div className="bg-neutral-800/60 rounded p-2">
                    <div className="text-xs text-neutral-400">OCR</div>
                    <div>準備はいい？</div>
                    <div className="text-xs text-neutral-400 mt-2">ES</div>
                    <div>¿Listo para esto?</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  return (
    <>
      {/* HERO (más comercial) */}
      <section className="mx-auto max-w-6xl px-4 pt-16 pb-10 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <div className="inline-flex items-center gap-2 text-[11px] px-2 py-1 rounded-full border border-emerald-700/50 text-emerald-300 bg-emerald-900/10">
            <Sparkle /> Beta pública del MVP
          </div>
          <h1 className="mt-4 text-4xl md:text-5xl font-bold leading-tight">
            Traducí mangas <span className="text-emerald-400">3× más rápido</span>.
          </h1>
          <p className="mt-4 text-lg text-neutral-300">
            Subí la página, marcá los globos y recibí un borrador en español listo para
            pulir. Sin fricción, sin configuración.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/studio" className="px-5 py-3 rounded bg-emerald-600 text-white shadow-sm hover:bg-emerald-500">Probar gratis</Link>
            <Link href="#pricing" className="px-5 py-3 rounded border border-neutral-700 hover:bg-neutral-900">Ver precios</Link>
            <span className="text-sm text-neutral-400 self-center">Sin tarjeta • Empezás hoy</span>
          </div>
          <div className="mt-4 text-sm text-neutral-400">
            JA→ES o EN→ES • Exportá texto • Sin almacenamiento por defecto
          </div>
        </div>
        <div>
          <AppPreview />
        </div>
      </section>

      {/* BENEFICIOS (market) */}
      <section className="mx-auto max-w-6xl px-4 pb-8">
        <div className="grid md:grid-cols-3 gap-3 text-sm">
          {[
            { t: "Menos trabajo manual", d: "Marcá globos con el mouse y controlá el orden de lectura." },
            { t: "Resultados en minutos", d: "OCR japonés + traducción automática en un solo flujo." },
            { t: "Texto listo para pulir", d: "Borrador en español neutro para editar a tu estilo." },
          ].map((f) => (
            <div key={f.t} className="flex items-start gap-2 rounded-xl border border-neutral-800 bg-neutral-950 p-3">
              <div className="mt-0.5 text-emerald-400"><Check /></div>
              <div>
                <div className="font-medium text-neutral-200">{f.t}</div>
                <div className="text-neutral-400">{f.d}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section id="how" className="mx-auto max-w-6xl px-4 py-12">
        <div className="md:w-3/4">
          <h2 className="text-2xl md:text-3xl font-bold">¿Cómo funciona?</h2>
          <p className="mt-2 text-neutral-300">Un flujo pensado para traductores freelance, fansubs y editoriales.</p>
        </div>
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          {[
            { k: "Subí tu página", d: "Arrastrá JPG/PNG. Cada globo traducido consume 1 crédito." },
            { k: "Marcá globos (ROI)", d: "Dibujá rectángulos. Ordená y ajustá antes de traducir." },
            { k: "Traducí y exportá", d: "OCR → normalización → traducción. Copiá el texto final." },
          ].map((x, i) => (
            <div key={x.k} className="p-6 rounded-2xl border border-neutral-800 bg-neutral-950">
              <div className="text-sm text-neutral-400">Paso {i + 1}</div>
              <div className="mt-1 font-semibold">{x.k}</div>
              <p className="mt-2 text-sm text-neutral-400">{x.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* COMPARACIÓN (Antes vs. NaruTrad) */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-2xl md:text-3xl font-bold">Antes vs. NaruTrad</h2>
        <div className="mt-6 grid md:grid-cols-2 gap-6 text-sm">
          <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-950">
            <div className="font-semibold text-neutral-200">Proceso manual</div>
            <ul className="mt-3 space-y-2 text-neutral-400">
              <li className="flex gap-2"><span>•</span> OCR por fuera, copiar/pegar entre apps</li>
              <li className="flex gap-2"><span>•</span> Desorden en el orden de lectura</li>
              <li className="flex gap-2"><span>•</span> Mucho tiempo en tareas repetitivas</li>
            </ul>
          </div>
          <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-950">
            <div className="font-semibold text-neutral-200">Con NaruTrad</div>
            <ul className="mt-3 space-y-2 text-neutral-300">
              <li className="flex items-center gap-2"><Bolt /> Un solo lugar: canvas, OCR y traducción</li>
              <li className="flex items-center gap-2"><Bolt /> Orden de lectura bajo control</li>
              <li className="flex items-center gap-2"><Bolt /> Ahorro de tiempo por capítulo</li>
            </ul>
          </div>
        </div>
      </section>

      {/* CASOS DE USO */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-2xl md:text-3xl font-bold">Hecho para tu forma de trabajar</h2>
        <div className="mt-6 grid md:grid-cols-3 gap-6 text-sm">
          {[
            { t: "Traductores freelance", d: "Entregá borradores más rápido y concentrá tu tiempo en pulir el estilo." },
            { t: "Fansubs", d: "Coordinen globos y orden de lectura sin perder tiempo en copias y recortes." },
            { t: "Editoriales", d: "Un flujo simple para evaluaciones y pre-edición." },
          ].map((x) => (
            <div key={x.t} className="p-6 rounded-2xl border border-neutral-800 bg-neutral-950">
              <div className="font-semibold">{x.t}</div>
              <p className="mt-2 text-neutral-400">{x.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING (créditos) */}
      <section id="pricing" className="mx-auto max-w-6xl px-4 py-12">
        <div className="md:w-3/4">
          <h2 className="text-2xl md:text-3xl font-bold">Precios simples</h2>
          <p className="mt-2 text-neutral-300">Empezá gratis y escalá cuando lo necesites. Cada globo traducido = 1 crédito.</p>
        </div>
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-950">
            <div className="text-sm uppercase tracking-wide text-neutral-400">Gratis</div>
            <div className="mt-2 text-3xl font-bold">$0</div>
            <ul className="mt-4 text-sm text-neutral-300 space-y-2">
              <li className="flex items-center gap-2"><Check /> 20 créditos iniciales</li>
              <li className="flex items-center gap-2"><Check /> JA→ES o EN→ES</li>
              <li className="flex items-center gap-2"><Check /> Exportar texto</li>
            </ul>
            <Link href="/auth" className="mt-6 inline-block px-4 py-2 border border-neutral-700 rounded hover:bg-neutral-900">Crear cuenta</Link>
          </div>

          <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-950">
            <div className="text-sm uppercase tracking-wide text-neutral-400">Pack de créditos</div>
            <div className="mt-2 text-3xl font-bold">$5 USD</div>
            <ul className="mt-4 text-sm text-neutral-300 space-y-2">
              <li className="flex items-center gap-2"><Check /> 500 créditos</li>
              <li className="flex items-center gap-2"><Check /> Prioridad en cola</li>
              <li className="flex items-center gap-2"><Check /> Soporte por email</li>
            </ul>
            <Link href="/auth" className="mt-6 inline-block px-4 py-2 border border-neutral-700 rounded hover:bg-neutral-900">Comprar créditos</Link>
          </div>

          <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-950">
            <div className="text-sm uppercase tracking-wide text-neutral-400">Equipo</div>
            <div className="mt-2 text-3xl font-bold">A convenir</div>
            <ul className="mt-4 text-sm text-neutral-300 space-y-2">
              <li className="flex items-center gap-2"><Check /> Créditos flexibles</li>
              <li className="flex items-center gap-2"><Check /> Roles y permisos</li>
              <li className="flex items-center gap-2"><Check /> Integración a medida</li>
            </ul>
            <Link href="mailto:hola@nurutrad.app" className="mt-6 inline-block px-4 py-2 border border-neutral-700 rounded hover:bg-neutral-900">Contactar</Link>
          </div>
        </div>
        <p className="mt-4 text-xs text-neutral-500">Los valores son orientativos y pueden cambiar durante el MVP.</p>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-2xl md:text-3xl font-bold">Preguntas frecuentes</h2>
        <div className="mt-6 grid md:grid-cols-2 gap-4 text-sm text-neutral-300">
          {[ 
            ["¿Puedo traducir desde inglés?", "Sí. Podés elegir japonés o inglés como origen."],
            ["¿Se guarda mi contenido?", "El MVP procesa en memoria y descarta al terminar. Guardamos solo tu historial y tus créditos."],
            ["¿Puedo reordenar globos?", "Sí, controlás el orden de lectura antes de traducir."],
            ["¿Qué exporto?", "Texto final en español listo para pegar en tu editor."],
          ].map(([q, a]) => (
            <details key={q} className="border border-neutral-800 rounded-lg p-4 bg-neutral-950">
              <summary className="cursor-pointer font-medium text-neutral-200">{q}</summary>
              <p className="mt-2 text-neutral-400">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="p-6 md:p-10 rounded-2xl border border-neutral-800 bg-gradient-to-br from-neutral-950 to-neutral-900">
          <div className="grid md:grid-cols-2 gap-6 items-center">
            <div>
              <h3 className="text-2xl font-semibold">Probá NaruTrad hoy</h3>
              <p className="mt-2 text-neutral-300">Menos clics, más texto útil. Empezá gratis: sin tarjeta y sin complicaciones.</p>
              <div className="mt-5 flex gap-3">
                <Link href="/studio" className="px-5 py-3 rounded bg-emerald-600 text-white hover:bg-emerald-500">Abrir Studio</Link>
                <Link href="/auth" className="px-5 py-3 rounded border border-neutral-700 hover:bg-neutral-900">Crear cuenta</Link>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2 text-emerald-300"><Clock /> <span>Traducciones en minutos</span></div>
              <div className="flex items-center gap-2 text-emerald-300"><Cursor /> <span>Canvas simple</span></div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}