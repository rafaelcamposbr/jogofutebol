import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getPublicSupabaseEnv, getSupabaseSecretEnv } from "@/lib/env";

export function createSupabaseAdminClient() {
  const { url, configured: publicConfigured } = getPublicSupabaseEnv();
  const { secretKey, configured: secretConfigured } = getSupabaseSecretEnv();
  if (!publicConfigured || !secretConfigured) return null;

  return createClient(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

export function createSupabaseStatelessClient() {
  const { url, anonKey, configured } = getPublicSupabaseEnv();
  if (!configured) return null;

  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}
