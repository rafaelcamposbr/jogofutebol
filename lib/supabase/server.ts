import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { getPublicSupabaseEnv, getServiceSupabaseEnv } from "@/lib/env";

export async function createSupabaseServerClient() {
  const { url, anonKey, configured } = getPublicSupabaseEnv();
  if (!configured) return null;

  const cookieStore = await cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot always write cookies. Route handlers and actions can.
        }
      },
    },
  });
}

export function createSupabaseServiceClient() {
  const { url, serviceRoleKey, configured, serviceConfigured } = getServiceSupabaseEnv();
  if (!configured || !serviceConfigured) return null;

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
