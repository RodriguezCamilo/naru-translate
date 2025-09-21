import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";
import { createSupabaseRSC } from "@/lib/supabase-rsc";
import { CreditsBadge } from "@/components/CreditsBadge";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NaruTrad — Traducción de mangas con IA",
  description:
    "Subí tu página, marcá los globos, traducí. Impulsado por Vision + Gemini.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseRSC();

  // En RSC: getSession() (no intenta setear cookies)
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  let credits: number | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("credits")
      .eq("user_id", user.id)
      .maybeSingle();
    credits = profile?.credits ?? null;
  }

  return (
    <html lang="es" className="dark h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} h-full font-sans bg-neutral-950 text-neutral-100 antialiased`}
      >
        <header className="border-b border-neutral-800 bg-neutral-950/70 backdrop-blur">
          <nav className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/" className="font-bold">
                NaruTrad
              </Link>
              <Link
                href="/#features"
                className="text-sm text-neutral-300 hover:text-white"
              >
                Características
              </Link>
              <Link
                href="/#pricing"
                className="text-sm text-neutral-300 hover:text-white"
              >
                Precios
              </Link>
              <Link
                href="/#faq"
                className="text-sm text-neutral-300 hover:text-white"
              >
                FAQ
              </Link>
            </div>
            <div className="flex items-center gap-3">
              {user && <CreditsBadge initial={credits} />}
              {!user && (
                <Link
                  href="/auth"
                  className="text-sm px-3 py-1.5 rounded border border-neutral-700 hover:bg-neutral-900"
                >
                  Entrar
                </Link>
              )}
              <Link
                href="/studio"
                className="text-sm px-3 py-1.5 rounded bg-emerald-600 text-white"
              >
                Studio
              </Link>
              {user && (
                <Link
                  href="/history"
                  className="text-sm text-neutral-300 hover:text-white"
                >
                  Historial
                </Link>
              )}

              <LogoutButton />
            </div>
          </nav>
        </header>

        <main className="min-h-[calc(100vh-6rem)]">{children}</main>

        <footer className="border-t border-neutral-800 mt-16">
          <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-neutral-400">
            <div className="flex items-center justify-between">
              <p>© {new Date().getFullYear()} NaruTrad</p>
              <div className="flex gap-4">
                <Link href="/legal/privacidad" className="hover:underline">
                  Privacidad
                </Link>
                <Link href="/legal/terminos" className="hover:underline">
                  Términos
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
