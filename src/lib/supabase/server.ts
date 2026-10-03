import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Novi klijent za svaki zahtev; nikad ga ne čuvati u globalnoj promenljivoj.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server komponente ne smeju da pišu kolačiće; proxy osvežava sesiju.
          }
        },
      },
    },
  );
}
