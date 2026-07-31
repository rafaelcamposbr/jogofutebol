import { apiError, apiSuccess, getApiAuthContext, invalidateActiveChallenges } from "@/lib/auth/api";
import { normalizeEmail } from "@/lib/auth/validation";
import { createSupabaseStatelessClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const context = await getApiAuthContext();
  if ("error" in context) return context.error;

  const body = (await request.json().catch(() => null)) as { email?: string; currentPassword?: string } | null;
  const email = normalizeEmail(body?.email || "");
  const currentPassword = body?.currentPassword || "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !currentPassword) {
    return apiError("Informe o novo e-mail e a senha atual.", 422);
  }

  const passwordClient = createSupabaseStatelessClient();
  if (!passwordClient) return apiError("Servico de autenticacao indisponivel.", 503);
  const { error: passwordError } = await passwordClient.auth.signInWithPassword({
    email: context.profile.email,
    password: currentPassword,
  });
  if (passwordError) return apiError("Nao foi possivel confirmar a senha atual.", 401);

  const { data: duplicate } = await context.admin.from("profiles").select("id").eq("email", email).neq("id", context.user.id).limit(1).maybeSingle();
  if (duplicate) return apiError("Este e-mail ja esta em uso.", 409);

  const { error } = await context.admin.auth.admin.updateUserById(context.user.id, {
    email,
    email_confirm: true,
  });
  if (error) return apiError("Nao foi possivel alterar o e-mail.", 400);

  await invalidateActiveChallenges(context.admin, context.user.id, "email");
  return apiSuccess({ message: "E-mail alterado. Confirme o novo endereco para liberar a Imprensa." });
}
