import { apiError, apiSuccess, getApiAuthContext } from "@/lib/auth/api";
import { hashVerificationToken } from "@/lib/auth/tokens";

export async function POST(request: Request) {
  const context = await getApiAuthContext();
  if ("error" in context) return context.error;

  const body = (await request.json().catch(() => null)) as { token?: string } | null;
  const token = body?.token || "";
  if (!/^[A-Za-z0-9_-]{40,60}$/.test(token)) return apiError("Link invalido ou expirado.", 400);

  const tokenHash = hashVerificationToken(token);
  const { data: challenge } = await context.admin
    .from("verification_challenges")
    .select("id,user_id,destination_normalized,expires_at,used_at")
    .eq("channel", "email")
    .eq("provider", "resend_link")
    .eq("token_hash", tokenHash)
    .limit(1)
    .maybeSingle();

  if (
    !challenge ||
    challenge.user_id !== context.user.id ||
    challenge.used_at ||
    new Date(challenge.expires_at).getTime() <= Date.now() ||
    challenge.destination_normalized !== context.profile.email
  ) {
    return apiError("Link invalido ou expirado.", 400);
  }

  const { data: completed, error } = await context.admin.rpc("complete_game_verification", {
    p_user_id: context.user.id,
    p_channel: "email",
    p_challenge_id: challenge.id,
    p_destination_normalized: context.profile.email,
  });
  if (error || !completed) return apiError("Link invalido ou ja utilizado.", 400);

  return apiSuccess({ message: "E-mail confirmado. A Imprensa foi liberada." });
}
