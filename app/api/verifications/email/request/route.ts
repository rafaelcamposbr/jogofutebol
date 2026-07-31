import {
  apiError,
  apiSuccess,
  checkChallengeRateLimit,
  getApiAuthContext,
  invalidateActiveChallenges,
} from "@/lib/auth/api";
import { createVerificationToken } from "@/lib/auth/tokens";
import { maskEmail } from "@/lib/auth/validation";
import { getEmailVerificationEnv } from "@/lib/env";
import { sendGameEmailVerification } from "@/lib/verification/email";

export async function POST(request: Request) {
  const context = await getApiAuthContext();
  if ("error" in context) return context.error;
  if (context.profile.email_game_verified) return apiSuccess({ alreadyVerified: true });
  if (!getEmailVerificationEnv().configured) {
    return apiError("Envio de e-mail ainda nao configurado para esta Beta.", 503);
  }

  const limit = await checkChallengeRateLimit(context.admin, context.user.id, "email");
  if (!limit.allowed) {
    if ("unavailable" in limit) return apiError("Nao foi possivel validar o limite de envio.", 503);
    return apiError(`Aguarde ${limit.retryAfter} segundos antes de reenviar.`, 429);
  }

  await invalidateActiveChallenges(context.admin, context.user.id, "email");
  const { token, hash } = createVerificationToken();
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  const { data: challenge, error: insertError } = await context.admin
    .from("verification_challenges")
    .insert({
      user_id: context.user.id,
      channel: "email",
      provider: "resend_link",
      token_hash: hash,
      destination_normalized: context.profile.email,
      expires_at: expiresAt,
    })
    .select("id")
    .single();
  if (insertError || !challenge) return apiError("Nao foi possivel preparar a confirmacao.", 500);

  const sent = await sendGameEmailVerification({
    destination: context.profile.email,
    firstName: context.profile.first_name,
    requestOrigin: new URL(request.url).origin,
    token,
  });
  if (!sent.ok) {
    await context.admin.from("verification_challenges").delete().eq("id", challenge.id);
    return apiError("Nao foi possivel enviar a confirmacao agora.", 502);
  }

  return apiSuccess({
    message: `Enviamos a confirmacao para ${maskEmail(context.profile.email)}.`,
    expiresAt,
  });
}
