import { apiError, apiSuccess } from "@/lib/auth/api";
import { authenticatedHomeDestination } from "@/lib/auth/navigation";
import { classifyLoginIdentifier } from "@/lib/auth/validation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const LOGIN_ERROR = "Identificador ou senha invalidos.";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { identifier?: string; password?: string } | null;
  const identifier = body?.identifier?.trim() || "";
  const password = body?.password || "";
  if (!identifier || !password) return apiError(LOGIN_ERROR, 401);

  const admin = createSupabaseAdminClient();
  const supabase = await createSupabaseServerClient();
  if (!admin || !supabase) return apiError("Configuracao segura do servidor pendente.", 503);

  const classified = classifyLoginIdentifier(identifier);
  let query = admin.from("profiles").select("email,whatsapp_game_verified");
  if (classified.type === "email") query = query.eq("email", classified.normalized);
  if (classified.type === "username") query = query.eq("username_normalized", classified.normalized);
  if (classified.type === "whatsapp") query = query.eq("whatsapp_normalized", classified.normalized);

  const { data: profile, error: lookupError } = await query.limit(1).maybeSingle<{
    email: string;
    whatsapp_game_verified: boolean;
  }>();
  if (lookupError) return apiError("Nao foi possivel entrar agora.", 503);

  const authEmail = profile?.email || "conta-inexistente@invalid.local";
  const { data, error } = await supabase.auth.signInWithPassword({ email: authEmail, password });
  if (error || !data.user) return apiError(LOGIN_ERROR, 401);

  const { data: club, error: clubError } = await admin
    .from("clubs")
    .select("id")
    .eq("owner_id", data.user.id)
    .limit(1)
    .maybeSingle();
  if (clubError) return apiError("Nao foi possivel concluir o login agora.", 503);

  const response = apiSuccess({
    next: authenticatedHomeDestination({
      hasClub: Boolean(club),
      whatsappVerified: Boolean(profile?.whatsapp_game_verified),
    }),
  });
  response.cookies.delete("guest_mode");
  return response;
}
