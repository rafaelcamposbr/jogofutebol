export const APP_ENV = process.env.NEXT_PUBLIC_APP_ENV || "beta";
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || "0.1.0";

export function getPublicSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  return { url, anonKey, configured: Boolean(url && anonKey) };
}

export function getSupabaseSecretEnv() {
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return { secretKey, configured: Boolean(secretKey) };
}

export function getEmailVerificationEnv() {
  const apiKey = process.env.RESEND_API_KEY || "";
  const from = process.env.EMAIL_FROM || "";
  return { apiKey, from, configured: Boolean(apiKey && from) };
}

export function getTwilioVerifyEnv() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID || "";
  const authToken = process.env.TWILIO_AUTH_TOKEN || "";
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID || "";
  return {
    accountSid,
    authToken,
    serviceSid,
    configured: Boolean(accountSid && authToken && serviceSid),
  };
}

export function getSiteUrl(requestOrigin?: string) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL || "";
  if (configured) return configured.replace(/\/$/, "");
  return (requestOrigin || "http://localhost:3000").replace(/\/$/, "");
}

export function isBeta() {
  return APP_ENV.toLowerCase() === "beta";
}
