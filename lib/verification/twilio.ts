import "server-only";

import { getTwilioVerifyEnv } from "@/lib/env";

type TwilioVerificationResponse = {
  sid?: string;
  status?: string;
};

async function twilioVerifyRequest(path: string, body: URLSearchParams) {
  const env = getTwilioVerifyEnv();
  if (!env.configured) return { ok: false as const, reason: "not_configured" as const };

  const response = await fetch(`https://verify.twilio.com/v2/Services/${env.serviceSid}/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${env.accountSid}:${env.authToken}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });
  const data = (await response.json().catch(() => ({}))) as TwilioVerificationResponse;
  if (!response.ok) return { ok: false as const, reason: "provider_error" as const };
  return { ok: true as const, data };
}

export async function startWhatsappVerification(destination: string) {
  const result = await twilioVerifyRequest(
    "Verifications",
    new URLSearchParams({ To: destination, Channel: "whatsapp", Locale: "pt-BR" }),
  );
  if (!result.ok) return result;
  return { ok: true as const, externalId: result.data.sid || null };
}

export async function checkWhatsappVerification(destination: string, code: string) {
  const result = await twilioVerifyRequest(
    "VerificationCheck",
    new URLSearchParams({ To: destination, Code: code }),
  );
  if (!result.ok) return result;
  return { ok: true as const, approved: result.data.status === "approved" };
}
