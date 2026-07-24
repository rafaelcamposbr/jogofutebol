import { APP_ENV, APP_VERSION, getPublicSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getStatusData() {
  const supabaseEnv = getPublicSupabaseEnv();
  let supabaseStatus: "configured" | "not_configured" | "unavailable" = supabaseEnv.configured ? "configured" : "not_configured";
  let latestVersion = APP_VERSION;

  if (supabaseEnv.configured) {
    try {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase!
        .from("app_versions")
        .select("version")
        .eq("environment", APP_ENV)
        .order("released_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) supabaseStatus = "unavailable";
      if (data?.version) latestVersion = data.version;
    } catch {
      supabaseStatus = "unavailable";
    }
  }

  return {
    environment: APP_ENV,
    version: latestVersion,
    appStatus: "online",
    supabaseStatus,
    currentTime: new Date().toISOString(),
    lastDeploy: process.env.VERCEL_GIT_COMMIT_SHA ? process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7) : "indisponivel localmente",
    maintenanceMessage: "Sem manutencao programada.",
    demoFeatures: 7,
  };
}
