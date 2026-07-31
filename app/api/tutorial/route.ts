import { apiError, apiSuccess } from "@/lib/auth/api";
import { TUTORIAL_STEPS } from "@/lib/staff/engine";
import { getStaffContext } from "@/lib/staff/server";

const interimAdvisor = {
  name: "Marina Azevedo",
  role: "Coordenadora Administrativa Interina",
  subtitle: "Assistencia de implantacao",
  initials: "MA",
};

export async function GET() {
  const context = await getStaffContext();
  if (!context.ok) return context.error;
  if (!context.club) return apiSuccess({ progress: null, advisor: interimAdvisor, steps: TUTORIAL_STEPS });
  const { data: progress, error } = await context.admin.from("tutorial_progress").upsert({
    user_id: context.user.id,
    club_id: context.club.id,
  }, { onConflict: "user_id,club_id", ignoreDuplicates: true }).select("*").maybeSingle();
  if (error) return apiError("Nao foi possivel carregar o tutorial.", 500);
  const finalProgress = progress || (await context.admin.from("tutorial_progress").select("*").eq("user_id", context.user.id).eq("club_id", context.club.id).single()).data;
  return apiSuccess({ progress: finalProgress, advisor: interimAdvisor, steps: TUTORIAL_STEPS });
}

export async function PATCH(request: Request) {
  const context = await getStaffContext();
  if (!context.ok) return context.error;
  if (!context.club) return apiError("Crie um clube para iniciar o tutorial.", 409);
  const body = await request.json().catch(() => null) as { action?: string; tip?: string } | null;
  const { data: current } = await context.admin.from("tutorial_progress").select("*").eq("user_id", context.user.id).eq("club_id", context.club.id).maybeSingle();
  const base = current || {
    user_id: context.user.id,
    club_id: context.club.id,
    current_step: 1,
    completed_steps: [],
    contextual_tips_seen: [],
    status: "active",
  };
  let currentStep = Number(base.current_step) || 1;
  let completedSteps = [...(base.completed_steps || [])] as number[];
  let contextualTipsSeen = [...(base.contextual_tips_seen || [])] as string[];
  let status = String(base.status || "active");
  let completedAt = base.completed_at || null;
  switch (body?.action) {
    case "next":
    case "skip-step":
      completedSteps = [...new Set([...completedSteps, currentStep])].sort((a, b) => a - b);
      if (currentStep >= 10) { status = "completed"; completedAt = new Date().toISOString(); }
      else { currentStep += 1; status = "active"; }
      break;
    case "back": currentStep = Math.max(1, currentStep - 1); status = "active"; break;
    case "pause": status = "paused"; break;
    case "end": status = "skipped"; break;
    case "reopen": status = "active"; currentStep = Math.min(10, Math.max(1, currentStep)); completedAt = null; break;
    case "mark-tip":
      if (body.tip?.trim()) contextualTipsSeen = [...new Set([...contextualTipsSeen, body.tip.trim().slice(0, 100)])];
      break;
    default: return apiError("Acao de tutorial invalida.", 422);
  }
  const { data: progress, error } = await context.admin.from("tutorial_progress").upsert({
    user_id: context.user.id,
    club_id: context.club.id,
    current_step: currentStep,
    completed_steps: completedSteps,
    contextual_tips_seen: contextualTipsSeen,
    status,
    completed_at: completedAt,
  }, { onConflict: "user_id,club_id" }).select("*").single();
  if (error) return apiError("Nao foi possivel salvar o tutorial.", 500);
  return apiSuccess({ progress, advisor: interimAdvisor, steps: TUTORIAL_STEPS });
}
