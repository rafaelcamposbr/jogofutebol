import { apiError, apiSuccess } from "@/lib/auth/api";
import { logServerError, logServerEvent } from "@/lib/server/log";
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

  const key = { user_id: context.user.id, club_id: context.club.id };
  const { data: existing, error: selectError } = await context.admin
    .from("tutorial_progress")
    .select("*")
    .match(key)
    .maybeSingle();
  if (selectError) {
    logServerError("tutorial", "load_failed", selectError);
    return apiError("Nao foi possivel carregar o tutorial.", 500);
  }

  if (existing) return apiSuccess({ progress: existing, advisor: interimAdvisor, steps: TUTORIAL_STEPS });
  const { data: progress, error: insertError } = await context.admin
    .from("tutorial_progress")
    .insert(key)
    .select("*")
    .single();
  if (insertError) {
    logServerError("tutorial", "start_failed", insertError);
    return apiError("Nao foi possivel iniciar o tutorial.", 500);
  }
  logServerEvent("tutorial", "started");
  return apiSuccess({ progress, advisor: interimAdvisor, steps: TUTORIAL_STEPS });
}

export async function PATCH(request: Request) {
  const context = await getStaffContext();
  if (!context.ok) return context.error;
  if (!context.club) return apiError("Crie um clube para iniciar o tutorial.", 409);
  const body = await request.json().catch(() => null) as { action?: string; tip?: string } | null;
  const { data: current, error: selectError } = await context.admin
    .from("tutorial_progress")
    .select("*")
    .eq("user_id", context.user.id)
    .eq("club_id", context.club.id)
    .maybeSingle();
  if (selectError) {
    logServerError("tutorial", "progress_read_failed", selectError);
    return apiError("Nao foi possivel ler o progresso do tutorial.", 500);
  }

  const base = current || {
    user_id: context.user.id,
    club_id: context.club.id,
    current_step: 1,
    completed_steps: [],
    skipped_steps: [],
    contextual_tips_seen: [],
    status: "active",
    completed_at: null,
  };
  let currentStep = Number(base.current_step) || 1;
  let completedSteps = [...(base.completed_steps || [])] as number[];
  let skippedSteps = [...(base.skipped_steps || [])] as number[];
  let contextualTipsSeen = [...(base.contextual_tips_seen || [])] as string[];
  let status = String(base.status || "active");
  let completedAt = base.completed_at || null;

  switch (body?.action) {
    case "next":
      completedSteps = addStep(completedSteps, currentStep);
      skippedSteps = skippedSteps.filter((step) => step !== currentStep);
      if (currentStep >= TUTORIAL_STEPS.length) {
        status = "completed";
        completedAt = new Date().toISOString();
      } else {
        currentStep += 1;
        status = "active";
      }
      break;
    case "skip-step":
      skippedSteps = addStep(skippedSteps, currentStep);
      completedSteps = completedSteps.filter((step) => step !== currentStep);
      if (currentStep >= TUTORIAL_STEPS.length) {
        status = "skipped";
        completedAt = new Date().toISOString();
      } else {
        currentStep += 1;
        status = "active";
      }
      break;
    case "back":
      currentStep = Math.max(1, currentStep - 1);
      status = "active";
      break;
    case "pause":
      status = "paused";
      break;
    case "end":
      status = "skipped";
      completedAt = new Date().toISOString();
      break;
    case "reopen":
      status = "active";
      currentStep = Math.min(TUTORIAL_STEPS.length, Math.max(1, currentStep));
      completedAt = null;
      break;
    case "mark-tip":
      if (body.tip?.trim()) contextualTipsSeen = [...new Set([...contextualTipsSeen, body.tip.trim().slice(0, 100)])];
      break;
    default:
      return apiError("Acao de tutorial invalida.", 422);
  }

  const { data: progress, error } = await context.admin.from("tutorial_progress").upsert({
    user_id: context.user.id,
    club_id: context.club.id,
    current_step: currentStep,
    completed_steps: completedSteps,
    skipped_steps: skippedSteps,
    contextual_tips_seen: contextualTipsSeen,
    status,
    completed_at: completedAt,
  }, { onConflict: "user_id,club_id" }).select("*").single();
  if (error) {
    logServerError("tutorial", "progress_write_failed", error, { action: body?.action, currentStep });
    return apiError("Nao foi possivel salvar o tutorial.", 500);
  }
  logServerEvent("tutorial", "progress_saved", { action: body?.action, currentStep, status });
  return apiSuccess({ progress, advisor: interimAdvisor, steps: TUTORIAL_STEPS });
}

function addStep(steps: number[], current: number) {
  return [...new Set([...steps, current])].sort((a, b) => a - b);
}
