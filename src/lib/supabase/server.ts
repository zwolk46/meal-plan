import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  // cookies() is async in newer Next versions
  const cookieStore = (await cookies()) as any;

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: any[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              // Next supports object-form set({ name, value, ...options })
              cookieStore.set({ name, value, ...(options ?? {}) });
            });
          } catch {
            // Server Components can't reliably set cookies; proxy/middleware will handle refresh.
          }
        },
      },
    }
  );
}
