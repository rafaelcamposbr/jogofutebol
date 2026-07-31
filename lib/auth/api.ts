import "server-only";

import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { GameProfile } from "@/lib/auth/profile";

export function apiError(message: string, status = 400, fields?: Record<string, string>) {
  return NextResponse.json(
    { ok: false, message, ...(fields ? { fields } : {}) },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export function apiSuccess(data: Record<string, unknown> = {}) {
  return NextResponse.json(
    { ok: true, ...data },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function getApiAuthContext() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: apiError("Servico de autenticacao indisponivel.", 503) } as const;

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: apiError("Sessao expirada. Entre novamente.", 401) } as const;

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id,username,username_normalized,first_name,last_name,email,whatsapp,whatsapp_normalized,email_game_verified,whatsapp_game_verified,email_verified_at,whatsapp_verified_at,created_at",
    )
    .eq("id", userData.user.id)
    .single<GameProfile>();
  if (!profile) return { error: apiError("Perfil da conta nao encontrado.", 409) } as const;

  const admin = createSupabaseAdminClient();
  if (!admin) return { error: apiError("Configuracao segura do servidor pendente.", 503) } as const;

  return { supabase, admin, user: userData.user, profile } as const;
}

export async function checkChallengeRateLimit(
  admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  userId: string,
  channel: "email" | "whatsapp",
) {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data, error } = await admin
    .from("verification_challenges")
    .select("id,created_at")
    .eq("user_id", userId)
    .eq("channel", channel)
    .gte("created_at", oneHourAgo)
    .order("created_at", { ascending: false });

  if (error) return { allowed: false, unavailable: true } as const;
  if ((data || []).length >= 5) return { allowed: false, retryAfter: 3600 } as const;

  const latest = data?.[0]?.created_at ? new Date(data[0].created_at).getTime() : 0;
  const elapsedSeconds = Math.floor((Date.now() - latest) / 1000);
  if (latest && elapsedSeconds < 60) {
    return { allowed: false, retryAfter: 60 - elapsedSeconds } as const;
  }

  return { allowed: true } as const;
}

export async function invalidateActiveChallenges(
  admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  userId: string,
  channel: "email" | "whatsapp",
) {
  return admin
    .from("verification_challenges")
    .update({ used_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("channel", channel)
    .is("used_at", null);
}
