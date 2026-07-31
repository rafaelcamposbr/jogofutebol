import { apiError, apiSuccess } from "@/lib/auth/api";
import { interpretMeetingText } from "@/lib/staff/ai";
import {
  evaluateMeeting,
  isMeetingInterpretation,
  selectAdvisorForEvent,
  type EmployeeState,
} from "@/lib/staff/engine";
import { createAdvisorMessage, getStaffContext, levelsForEmployee } from "@/lib/staff/server";

export async function POST(request: Request) {
  const context = await getStaffContext();
  if (!context.ok) return context.error;
  if (!context.club) return apiError("Clube nao encontrado.", 409);
  const body = await request.json().catch(() => null) as {
    employeeId?: string;
    subject?: string;
    text?: string;
    collective?: boolean;
    aptitudeTarget?: string;
  } | null;
  const employeeId = body?.employeeId || "";
  const subject = body?.subject?.trim().slice(0, 180) || "";
  const originalText = body?.text?.trim().slice(0, 5000) || "";
  if (!employeeId || subject.length < 3 || originalText.length < 3) {
    return apiError("Informe funcionario, assunto e texto da reuniao.", 422);
  }

  const [{ data: employee }, { data: status }, { data: concepts }, { data: recent }, { data: staff }] = await Promise.all([
    context.admin.from("employees").select("id,name,role_id,role_label,status,aptitudes").eq("id", employeeId).eq("club_id", context.club.id).eq("status", "active").maybeSingle(),
    context.admin.from("employee_status").select("*").eq("employee_id", employeeId).maybeSingle(),
    context.admin.from("employee_personality_concepts").select("employee_id,concept,level").eq("employee_id", employeeId),
    context.admin.from("meetings").select("id,subject,original_text,created_at").eq("club_id", context.club.id).gte("created_at", new Date(Date.now() - 7 * 86_400_000).toISOString()).order("created_at", { ascending: false }),
    context.admin.from("employees").select("id,role_id,status").eq("club_id", context.club.id),
  ]);
  if (!employee || !status) return apiError("Funcionario ativo nao encontrado.", 404);

  const levels = levelsForEmployee(concepts || [], employeeId);
  const interpreted = await interpretMeetingText({
    text: originalText,
    collective: Boolean(body?.collective),
    previousSubjects: (recent || []).map((meeting) => meeting.original_text || meeting.subject),
    employeeRole: employee.role_label,
    personalityDescriptions: Object.entries(levels)
      .filter(([, level]) => level >= 4)
      .map(([concept]) => concept),
  });
  const interpretation = interpreted.interpretation;
  if (!isMeetingInterpretation(interpretation)) return apiError("Nao foi possivel interpretar a reuniao.", 422);
  const state: EmployeeState = {
    satisfaction: Number(status.satisfaction_score),
    trust: Number(status.trust_in_leadership),
    morale: Number(status.professional_morale),
    workload: Number(status.workload),
    meetingFatigue: Number(status.meeting_fatigue),
    trainingFatigue: Number(status.training_fatigue),
  };
  const aptitudeKeys = Object.keys((employee.aptitudes || {}) as Record<string, number>);
  const aptitudeTarget = aptitudeKeys.includes(body?.aptitudeTarget || "") ? body?.aptitudeTarget! : aptitudeKeys[0] || "management";
  const evaluation = evaluateMeeting({
    employeeId,
    concepts: levels,
    state,
    interpretation,
    recentMeetingCount: (recent || []).length,
    aptitudeTarget,
  });

  const { data: meeting, error: meetingError } = await context.admin.from("meetings").insert({
    club_id: context.club.id,
    created_by: context.user.id,
    meeting_type: interpretation.meetingClassification,
    subject,
    original_text: originalText,
    tone: interpretation.tone,
    status: "in_progress",
    interpretation,
    started_at: new Date().toISOString(),
  }).select("id").single();
  if (meetingError || !meeting) return apiError("Nao foi possivel registrar a reuniao.", 500);

  const { error: participantError } = await context.admin.from("meeting_participants").insert([
    { meeting_id: meeting.id, participant_type: "user", participant_id: context.user.id, role_in_meeting: "organizer" },
    { meeting_id: meeting.id, participant_type: "employee", participant_id: employee.id, employee_id: employee.id, role_in_meeting: "participant" },
  ]);
  if (participantError) {
    await context.admin.from("meetings").update({ status: "cancelled" }).eq("id", meeting.id);
    return apiError("Nao foi possivel registrar os participantes.", 500);
  }
  const { error: resultError } = await context.admin.rpc("apply_employee_meeting_result", {
    p_user_id: context.user.id,
    p_meeting_id: meeting.id,
    p_employee_id: employee.id,
    p_result: evaluation,
  });
  if (resultError) {
    await context.admin.from("meetings").update({ status: "cancelled" }).eq("id", meeting.id);
    return apiError("O motor recusou os efeitos calculados da reuniao.", 422);
  }

  const advisor = selectAdvisorForEvent((staff || []).map((item) => ({ id: item.id, roleId: item.role_id, status: item.status })), "meeting");
  const responsible = advisor
    ? (staff || []).find((item) => item.id === advisor.id)
    : null;
  const reportTitle = evaluation.reportTone === "critical" ? "Reuniao exige acompanhamento" : evaluation.reportTone === "positive" ? "Reuniao produtiva" : "Relatorio da reuniao";
  await createAdvisorMessage(context.admin, {
    clubId: context.club.id,
    employeeId: responsible?.id || employee.id,
    eventType: "meeting_result",
    relatedEntityType: "meeting",
    relatedEntityId: meeting.id,
    priority: evaluation.reportTone === "critical" ? "critical" : evaluation.reportTone === "concern" ? "high" : "medium",
    tone: evaluation.reportTone === "critical" ? "urgent_alert" : evaluation.reportTone === "concern" ? "alert" : evaluation.reportTone === "positive" ? "praise" : "information",
    title: reportTitle,
    message: `${employee.name}: ${evaluation.narrative}`,
    reason: `Satisfacao ${signed(evaluation.satisfactionDelta)}, confianca ${signed(evaluation.trustDelta)} e fadiga ${signed(evaluation.fatigueDelta)}.`,
    recommendation: evaluation.warnings[0] || "Acompanhe os compromissos e o efeito nas proximas decisoes.",
    impact: evaluation,
    actions: [
      { label: "Ver reuniao", href: "/escritorio/inteligencia?tab=meetings" },
      { label: "Ver funcionario", href: `/escritorio/inteligencia?employee=${employee.id}` },
    ],
  });

  const psychologist = (staff || []).find((item) => item.role_id === "psychologist" && item.status === "active");
  const psychologistNote = psychologist && (evaluation.moraleDelta < 0 || evaluation.satisfactionDelta < -2)
    ? "A forma da conversa merece acompanhamento particular nos proximos dias."
    : null;
  return apiSuccess({ meetingId: meeting.id, interpretation, interpretationSource: interpreted.source, evaluation, report: {
    responsibleEmployeeId: responsible?.id || null,
    responsibleRole: responsible ? "Coordenador administrativo" : "Relatorio basico do sistema",
    psychologistNote,
  } });
}

function signed(value: number) {
  return value > 0 ? `+${value}` : String(value);
}
