import { apiError, apiSuccess, getApiAuthContext } from "@/lib/auth/api";
import { getTwilioVerifyEnv } from "@/lib/env";
import { checkWhatsappVerification } from "@/lib/verification/twilio";

export async function POST(request: Request) {
  const context = await getApiAuthContext();
  if ("error" in context) return context.error;
  if (!context.profile.whatsapp_normalized) return apiError("WhatsApp nao cadastrado.", 422);
  if (!getTwilioVerifyEnv().configured) return apiError("Envio por WhatsApp ainda nao configurado.", 503);

  const body = (await request.json().catch(() => null)) as { code?: string } | null;
  const code = (body?.code || "").replace(/\D/g, "");
  if (!/^\d{4,10}$/.test(code)) return apiError("Codigo invalido ou expirado.", 400);

  const { data: challenge } = await context.admin
    .from("verification_challenges")
    .select("id,user_id,destination_normalized,expires_at,used_at,attempt_count")
    .eq("user_id", context.user.id)
    .eq("channel", "whatsapp")
    .eq("provider", "twilio_verify")
    .is("used_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (
    !challenge ||
    challenge.attempt_count >= 5 ||
    new Date(challenge.expires_at).getTime() <= Date.now() ||
    challenge.destination_normalized !== context.profile.whatsapp_normalized
  ) {
    return apiError("Codigo invalido ou expirado.", 400);
  }

  const checked = await checkWhatsappVerification(context.profile.whatsapp_normalized, code);
  if (!checked.ok || !checked.approved) {
    const attempts = challenge.attempt_count + 1;
    await context.admin
      .from("verification_challenges")
      .update({ attempt_count: attempts, ...(attempts >= 5 ? { used_at: new Date().toISOString() } : {}) })
      .eq("id", challenge.id);
    return apiError("Codigo invalido ou expirado.", 400);
  }

  const { data: completed, error } = await context.admin.rpc("complete_game_verification", {
    p_user_id: context.user.id,
    p_channel: "whatsapp",
    p_challenge_id: challenge.id,
    p_destination_normalized: context.profile.whatsapp_normalized,
  });
  if (error || !completed) return apiError("Codigo invalido ou ja utilizado.", 400);

  return apiSuccess({ message: "WhatsApp confirmado. O Escritorio foi liberado." });
}
