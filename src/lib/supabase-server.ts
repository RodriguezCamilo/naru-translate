import {
  createServerClient,
  type CookieOptions,
  type CookieMethodsServer,
} from "@supabase/ssr";
import { cookies as nextCookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** Route Handlers / Server Actions: PUEDE modificar cookies */
export async function createSupabaseServer() {
  const cookieStore = await (nextCookies() as any);
  return createServerClient(URL, ANON, {
    cookies: {
      getAll() {
        return cookieStore.getAll().map((c: any) => ({ name: c.name, value: c.value }));
      },
      setAll(cookies) {
        // En Route Handlers / Server Actions SÍ podemos setear
        cookies.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options as CookieOptions);
        });
      },
    } satisfies CookieMethodsServer,
  });
}

/** Middleware (usa NextRequest/NextResponse) */
export function createSupabaseMiddlewareClient(req: NextRequest, res: NextResponse) {
  return createServerClient(URL, ANON, {
    cookies: {
      getAll() {
        return req.cookies.getAll().map((c) => ({ name: c.name, value: c.value }));
      },
      setAll(cookies) {
        cookies.forEach(({ name, value, options }) => {
          res.cookies.set(name, value, options as CookieOptions);
        });
      },
    } satisfies CookieMethodsServer,
  });
}
