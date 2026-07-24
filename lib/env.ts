export const APP_ENV = process.env.NEXT_PUBLIC_APP_ENV || "beta";
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || "0.1.0";

export function getPublicSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  return { url, anonKey, configured: Boolean(url && anonKey) };
}

export function getServiceSupabaseEnv() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return { ...getPublicSupabaseEnv(), serviceRoleKey, serviceConfigured: Boolean(serviceRoleKey) };
}

export function isBeta() {
  return APP_ENV.toLowerCase() === "beta";
}
