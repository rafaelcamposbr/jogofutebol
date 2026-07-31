import { apiError, apiSuccess } from "@/lib/auth/api";
import { calculateCourseReaction, COURSE_CATALOG, type EmployeeState } from "@/lib/staff/engine";
import { createAdvisorMessage, getStaffContext, levelsForEmployee } from "@/lib/staff/server";

export async function POST(request: Request) {
  const context = await getStaffContext();
  if (!context.ok) return context.error;
  if (!context.club) return apiError("Clube nao encontrado.", 409);
  const body = await request.json().catch(() => null) as {
    employeeId?: string;
    courseType?: "ead" | "weekend" | "immersion";
    domain?: string;
    subject?: string;
    level?: "basic" | "intermediate" | "advanced";
    aptitudeTarget?: string;
    selectedByEmployee?: boolean;
    forced?: boolean;
  } | null;
  if (!body?.employeeId || !body.courseType || !COURSE_CATALOG[body.courseType]
    || !body.domain?.trim() || !body.subject?.trim()
    || !["basic", "intermediate", "advanced"].includes(body.level || "")
    || !body.aptitudeTarget?.trim()) {
    return apiError("Dados do curso invalidos.", 422);
  }

  const [{ data: employee }, { data: status }, { data: concepts }, { count: repeated }, { count: recent }] = await Promise.all([
    context.admin.from("employees").select("id,name,role_id,role_label,status,aptitudes").eq("id", body.employeeId).eq("club_id", context.club.id).eq("status", "active").maybeSingle(),
    context.admin.from("employee_status").select("*").eq("employee_id", body.employeeId).maybeSingle(),
    context.admin.from("employee_personality_concepts").select("employee_id,concept,level").eq("employee_id", body.employeeId),
    context.admin.from("employee_courses").select("id", { count: "exact", head: true }).eq("employee_id", body.employeeId).eq("course_domain", body.domain.trim()).eq("course_subject", body.subject.trim()).eq("status", "completed").gte("completed_at", new Date(Date.now() - 180 * 86_400_000).toISOString()),
    context.admin.from("employee_courses").select("id", { count: "exact", head: true }).eq("employee_id", body.employeeId).in("status", ["scheduled", "in_progress", "completed"]).gte("created_at", new Date(Date.now() - 90 * 86_400_000).toISOString()),
  ]);
  if (!employee || !status) return apiError("Funcionario ativo nao encontrado.", 404);
  const aptitudeKeys = Object.keys((employee.aptitudes || {}) as Record<string, number>);
  if (!aptitudeKeys.includes(body.aptitudeTarget)) return apiError("Aptidao alvo invalida para este funcionario.", 422);
  const levels = levelsForEmployee(concepts || [], employee.id);
  const state: EmployeeState = {
    satisfaction: Number(status.satisfaction_score),
    trust: Number(status.trust_in_leadership),
    morale: Number(status.professional_morale),
    workload: Number(status.workload),
    meetingFatigue: Number(status.meeting_fatigue),
    trainingFatigue: Number(status.training_fatigue),
  };
  const reaction = calculateCourseReaction({
    concepts: levels,
    state,
    forced: Boolean(body.forced),
    selectedByEmployee: Boolean(body.selectedByEmployee),
    repeated: (repeated || 0) > 0,
    relatedToRole: true,
    recentCourseCount: recent || 0,
    courseLevel: body.level!,
  });
  if (reaction.refusalRisk >= 60 && !body.forced && !body.selectedByEmployee) {
    return apiError("O funcionario questionou o curso. Explique, troque, adie ou confirme a imposicao.", 409, {
      reaction: JSON.stringify(reaction),
    });
  }

  const { data: courseId, error } = await context.admin.rpc("start_employee_course", {
    p_user_id: context.user.id,
    p_employee_id: employee.id,
    p_course_type: body.courseType,
    p_domain: body.domain.trim().slice(0, 100),
    p_subject: body.subject.trim().slice(0, 160),
    p_level: body.level,
    p_aptitude_target: body.aptitudeTarget,
    p_selected_by_employee: Boolean(body.selectedByEmployee),
    p_forced: Boolean(body.forced),
  });
  if (error) {
    if (error.message.includes("insufficient_club_cash")) return apiError("Caixa insuficiente para este curso.", 409);
    if (error.message.includes("already_in_course")) return apiError("O funcionario ja esta em um curso.", 409);
    return apiError("Nao foi possivel iniciar o curso.", 422);
  }
  const { data: course } = await context.admin.from("employee_courses").select("*").eq("id", courseId).single();
  await createAdvisorMessage(context.admin, {
    clubId: context.club.id,
    employeeId: employee.id,
    eventType: "course_started",
    relatedEntityType: "course",
    relatedEntityId: String(courseId),
    priority: reaction.response === "resistant" ? "high" : "medium",
    tone: reaction.response === "positive" ? "praise" : reaction.response === "resistant" ? "complaint" : "information",
    title: reaction.response === "positive" ? "Curso bem recebido" : "Curso registrado",
    message: reaction.response === "positive"
      ? `${employee.name} considera o conteudo util para seu desenvolvimento.`
      : `${employee.name} iniciara o curso com tolerancia calculada em ${reaction.tolerance} curso(s) por 90 dias.`,
    reason: `Reacao de satisfacao ${reaction.satisfactionDelta >= 0 ? "+" : ""}${reaction.satisfactionDelta}; fadiga +${reaction.fatigueDelta}.`,
    recommendation: reaction.refusalRisk >= 40 ? "Converse com o funcionario antes de impor novos treinamentos." : "Reconheca a conclusao quando o curso terminar.",
    impact: { reaction, course },
    actions: [{ label: "Ver cursos", href: "/escritorio/inteligencia?tab=courses" }],
  });
  return apiSuccess({ course, reaction });
}

export async function PATCH(request: Request) {
  const context = await getStaffContext();
  if (!context.ok) return context.error;
  if (!context.club) return apiError("Clube nao encontrado.", 409);
  const body = await request.json().catch(() => null) as { courseId?: string; action?: string } | null;
  if (!body?.courseId || body.action !== "cancel") return apiError("Acao de curso invalida.", 422);
  const { data: refund, error } = await context.admin.rpc("cancel_employee_course", {
    p_user_id: context.user.id,
    p_course_id: body.courseId,
    p_now: new Date().toISOString(),
  });
  if (error) return apiError("O curso nao pode mais ser cancelado.", 409);
  return apiSuccess({ refund: Number(refund || 0) });
}
