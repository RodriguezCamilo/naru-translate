import {
  createServerClient,
  type CookieMethodsServer,
} from "@supabase/ssr";
import { cookies as nextCookies } from "next/headers";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** Server Components (RSC): NO modifica cookies */
export async function createSupabaseRSC() {
  const cookieStore = await (nextCookies() as any);

  return createServerClient(URL, ANON, {
    cookies: {
      getAll() {
        // leer cookies está OK en RSC
        return cookieStore.getAll().map((c: any) => ({ name: c.name, value: c.value }));
      },
      // IMPORTANTE: NO-OPs en RSC (no se puede setear cookies aquí)
      setAll() {},
    } satisfies CookieMethodsServer,
    // Opcional: evitar refrescos que intenten setear cookies igual
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}
