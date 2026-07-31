import {
  apiError,
  apiSuccess,
  checkChallengeRateLimit,
  getApiAuthContext,
  invalidateActiveChallenges,
} from "@/lib/auth/api";
import { maskWhatsapp } from "@/lib/auth/validation";
import { getTwilioVerifyEnv } from "@/lib/env";
import { startWhatsappVerification } from "@/lib/verification/twilio";

export async function POST() {
  const context = await getApiAuthContext();
  if ("error" in context) return context.error;
  if (context.profile.whatsapp_game_verified) return apiSuccess({ alreadyVerified: true });
  if (!context.profile.whatsapp_normalized) return apiError("Cadastre um WhatsApp antes de solicitar o codigo.", 422);
  if (!getTwilioVerifyEnv().configured) {
    return apiError("Envio por WhatsApp ainda nao configurado para esta Beta.", 503);
  }

  const limit = await checkChallengeRateLimit(context.admin, context.user.id, "whatsapp");
  if (!limit.allowed) {
    if ("unavailable" in limit) return apiError("Nao foi possivel validar o limite de envio.", 503);
    return apiError(`Aguarde ${limit.retryAfter} segundos antes de reenviar.`, 429);
  }

  await invalidateActiveChallenges(context.admin, context.user.id, "whatsapp");
  const started = await startWhatsappVerification(context.profile.whatsapp_normalized);
  if (!started.ok) return apiError("Nao foi possivel enviar o codigo por WhatsApp.", 502);

  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const { error } = await context.admin.from("verification_challenges").insert({
    user_id: context.user.id,
    channel: "whatsapp",
    provider: "twilio_verify",
    external_id: started.externalId,
    destination_normalized: context.profile.whatsapp_normalized,
    expires_at: expiresAt,
  });
  if (error) return apiError("O codigo foi enviado, mas o desafio nao pode ser registrado.", 500);

  return apiSuccess({
    message: `Codigo enviado para ${maskWhatsapp(context.profile.whatsapp_normalized)}.`,
    expiresAt,
  });
}
