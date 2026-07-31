import { apiError, apiSuccess } from "@/lib/auth/api";
import { type SignupInput, validateSignupInput } from "@/lib/auth/validation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const input = (await request.json().catch(() => null)) as SignupInput | null;
  if (!input) return apiError("Dados de cadastro invalidos.");

  const validation = validateSignupInput(input);
  if (!validation.value) return apiError("Revise os campos informados.", 422, validation.errors);

  const admin = createSupabaseAdminClient();
  const supabase = await createSupabaseServerClient();
  if (!admin || !supabase) return apiError("Configuracao segura do servidor pendente.", 503);

  const value = validation.value;
  const [usernameResult, whatsappResult, emailResult] = await Promise.all([
    admin.from("profiles").select("id").eq("username_normalized", value.usernameNormalized).limit(1).maybeSingle(),
    admin.from("profiles").select("id").eq("whatsapp_normalized", value.whatsapp).limit(1).maybeSingle(),
    admin.from("profiles").select("id").eq("email", value.email).limit(1).maybeSingle(),
  ]);

  if (usernameResult.error || whatsappResult.error || emailResult.error) {
    return apiError("Nao foi possivel validar o cadastro agora.", 503);
  }
  if (usernameResult.data) return apiError("Este nome de usuario ja esta em uso.", 409, { username: "Nome de usuario indisponivel." });
  if (whatsappResult.data) return apiError("Este WhatsApp ja esta em uso.", 409, { whatsapp: "WhatsApp ja cadastrado." });
  if (emailResult.data) return apiError("Este e-mail ja esta em uso.", 409, { email: "E-mail ja cadastrado." });

  const { data, error } = await supabase.auth.signUp({
    email: value.email,
    password: value.password,
    options: {
      data: {
        username: value.username,
        username_normalized: value.usernameNormalized,
        first_name: value.firstName,
        last_name: value.lastName,
        whatsapp_normalized: value.whatsapp,
      },
    },
  });

  if (error || !data.user) {
    return apiError("Nao foi possivel criar a conta. Revise os dados e tente novamente.", 400);
  }

  if (!data.user.identities?.length) {
    return apiError("Este e-mail ja esta em uso.", 409, { email: "E-mail ja cadastrado." });
  }

  if (!data.session) {
    await admin.auth.admin.deleteUser(data.user.id);
    return apiError("A confirmacao nativa de e-mail precisa permanecer desativada neste projeto.", 503);
  }

  const { data: profile } = await admin.from("profiles").select("id").eq("id", data.user.id).maybeSingle();
  if (!profile) {
    await supabase.auth.signOut();
    await admin.auth.admin.deleteUser(data.user.id);
    return apiError("Nao foi possivel concluir o perfil. A conta parcial foi removida.", 500);
  }

  return apiSuccess({ next: "/criar-clube" });
}
