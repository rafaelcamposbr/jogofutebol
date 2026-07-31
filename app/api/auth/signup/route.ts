import { apiError, apiSuccess } from "@/lib/auth/api";
import {
  type NormalizedSignup,
  type SignupErrors,
  type SignupInput,
  validateSignupInput,
} from "@/lib/auth/validation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type AdminClient = NonNullable<ReturnType<typeof createSupabaseAdminClient>>;

async function checkSignupConflicts(admin: AdminClient, value: NormalizedSignup) {
  const [usernameResult, whatsappResult, emailResult] = await Promise.all([
    admin.from("profiles").select("id").eq("username_normalized", value.usernameNormalized).limit(1).maybeSingle(),
    admin.from("profiles").select("id").eq("whatsapp_normalized", value.whatsapp).limit(1).maybeSingle(),
    admin.from("profiles").select("id").eq("email", value.email).limit(1).maybeSingle(),
  ]);

  if (usernameResult.error || whatsappResult.error || emailResult.error) {
    return { technicalError: true } as const;
  }

  const fields: SignupErrors = {};
  if (usernameResult.data) fields.username = "Este nome de usuario ja esta em uso.";
  if (whatsappResult.data) fields.whatsapp = "Este WhatsApp ja esta em uso.";
  if (emailResult.data) fields.email = "Este e-mail ja esta em uso.";
  return { technicalError: false, fields } as const;
}

function conflictResponse(fields: SignupErrors) {
  if (fields.username) return apiError(fields.username, 409, fields);
  if (fields.whatsapp) return apiError(fields.whatsapp, 409, fields);
  return apiError(fields.email || "Dados ja cadastrados.", 409, fields);
}

export async function POST(request: Request) {
  const input = (await request.json().catch(() => null)) as SignupInput | null;
  if (!input) return apiError("Dados de cadastro invalidos.");

  const validation = validateSignupInput(input);
  if (!validation.value) return apiError("Revise os campos informados.", 422, validation.errors);

  const admin = createSupabaseAdminClient();
  const supabase = await createSupabaseServerClient();
  if (!admin || !supabase) return apiError("Configuracao segura do servidor pendente.", 503);

  const value = validation.value;
  const conflict = await checkSignupConflicts(admin, value);
  if (conflict.technicalError) {
    return apiError("Nao foi possivel validar o cadastro agora.", 503);
  }
  if (Object.keys(conflict.fields).length > 0) return conflictResponse(conflict.fields);

  const { data, error } = await admin.auth.admin.createUser({
    email: value.email,
    password: value.password,
    email_confirm: true,
    user_metadata: {
      username: value.username,
      username_normalized: value.usernameNormalized,
      first_name: value.firstName,
      last_name: value.lastName,
      whatsapp_normalized: value.whatsapp,
    },
  });

  if (error || !data.user) {
    const postConflict = await checkSignupConflicts(admin, value);
    if (!postConflict.technicalError && Object.keys(postConflict.fields).length > 0) {
      return conflictResponse(postConflict.fields);
    }
    if (error?.code === "email_exists" || error?.code === "user_already_exists") {
      return apiError("Este e-mail ja esta em uso.", 409, { email: "Este e-mail ja esta em uso." });
    }
    return apiError("Nao foi possivel criar a conta. Revise os dados e tente novamente.", 400);
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id")
    .eq("id", data.user.id)
    .maybeSingle();
  if (profileError || !profile) {
    await admin.auth.admin.deleteUser(data.user.id);
    return apiError("Nao foi possivel concluir o perfil. A conta parcial foi removida.", 500);
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
    email: value.email,
    password: value.password,
  });
  if (sessionError || !sessionData.session) {
    await admin.auth.admin.deleteUser(data.user.id);
    return apiError("Nao foi possivel iniciar a sessao. A conta parcial foi removida.", 500);
  }

  return apiSuccess({ next: "/criar-clube" });
}
