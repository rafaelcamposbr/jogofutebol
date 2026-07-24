"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getPublicSupabaseEnv } from "@/lib/env";

export function createSupabaseBrowserClient() {
  const { url, anonKey, configured } = getPublicSupabaseEnv();
  if (!configured) {
    throw new Error("Supabase nao configurado. Preencha NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }
  return createBrowserClient(url, anonKey);
}

export function hasBrowserSupabaseEnv() {
  return getPublicSupabaseEnv().configured;
}
