import { apiError, apiSuccess, getApiAuthContext, invalidateActiveChallenges } from "@/lib/auth/api";
import { normalizeBrazilianWhatsapp } from "@/lib/auth/validation";
import { createSupabaseStatelessClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const context = await getApiAuthContext();
  if ("error" in context) return context.error;

  const body = (await request.json().catch(() => null)) as { whatsapp?: string; currentPassword?: string } | null;
  const whatsapp = normalizeBrazilianWhatsapp(body?.whatsapp || "");
  const currentPassword = body?.currentPassword || "";
  if (!whatsapp || !currentPassword) return apiError("Informe um WhatsApp valido e a senha atual.", 422);

  const passwordClient = createSupabaseStatelessClient();
  if (!passwordClient) return apiError("Servico de autenticacao indisponivel.", 503);
  const { error: passwordError } = await passwordClient.auth.signInWithPassword({
    email: context.profile.email,
    password: currentPassword,
  });
  if (passwordError) return apiError("Nao foi possivel confirmar a senha atual.", 401);

  const { data: duplicate } = await context.admin
    .from("profiles")
    .select("id")
    .eq("whatsapp_normalized", whatsapp)
    .neq("id", context.user.id)
    .limit(1)
    .maybeSingle();
  if (duplicate) return apiError("Este WhatsApp ja esta em uso.", 409);

  const { error } = await context.admin
    .from("profiles")
    .update({
      whatsapp,
      whatsapp_normalized: whatsapp,
      whatsapp_game_verified: false,
      whatsapp_verified_at: null,
    })
    .eq("id", context.user.id);
  if (error) return apiError("Nao foi possivel alterar o WhatsApp.", 400);

  await invalidateActiveChallenges(context.admin, context.user.id, "whatsapp");
  return apiSuccess({ message: "WhatsApp alterado. Confirme o novo numero para liberar o Escritorio." });
}
