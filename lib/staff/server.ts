import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { apiError, getApiAuthContext } from "@/lib/auth/api";
import { logServerError } from "@/lib/server/log";
import {
  describePersonality,
  generateNaturalTalents,
  generatePersonality,
  PERSONALITY_CONCEPTS,
  processEmployeeDailyState,
  satisfactionBand,
  type EmployeeState,
  type PersonalityLevels,
} from "@/lib/staff/engine";

type AdminClient = SupabaseClient;

export async function getStaffContext() {
  const context = await getApiAuthContext();
  if (context.error) return { ok: false as const, error: context.error };
  const authenticated = context as Extract<typeof context, { user: unknown }>;
  const { data: club, error: clubError } = await authenticated.admin
    .from("clubs")
    .select("id,name,legal_model,cash_balance")
    .eq("owner_id", authenticated.user.id)
    .maybeSingle();
  if (clubError) {
    logServerError("navigation", "staff_club_lookup_failed", clubError);
    return { ok: false as const, error: apiError("Nao foi possivel carregar o clube agora.", 503) };
  }
  return {
    ok: true as const,
    supabase: authenticated.supabase,
    admin: authenticated.admin,
    user: authenticated.user,
    profile: authenticated.profile,
    club: club || null,
  };
}

export function sanitizeLegacyEmployee(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const text = (key: string, max: number) => typeof raw[key] === "string" ? String(raw[key]).trim().slice(0, max) : "";
  const legacyId = text("id", 120);
  const name = text("name", 120);
  const roleId = text("roleId", 80);
  const roleLabel = text("roleLabel", 120);
  const groupId = text("groupId", 40);
  if (!legacyId || name.length < 2 || roleId.length < 2 || roleLabel.length < 2
    || !["coaches", "technical", "football", "medical", "administrative", "operations"].includes(groupId)) return null;
  const attributes = raw.attributes && typeof raw.attributes === "object" && !Array.isArray(raw.attributes)
    ? Object.fromEntries(Object.entries(raw.attributes as Record<string, unknown>).slice(0, 40).map(([key, item]) => [
      key.slice(0, 80),
      Math.max(0, Math.min(100, Number(item) || 0)),
    ]))
    : {};
  return {
    legacyId,
    professionalId: text("professionalId", 120),
    name,
    roleId,
    roleLabel,
    groupId,
    status: ["active", "notice", "resigned", "fired", "expired"].includes(String(raw.status)) ? String(raw.status) : "active",
    salary: Math.max(0, Math.min(100_000_000, Number(raw.salary) || 0)),
    contractStartAt: validDate(raw.contractStartAt),
    contractEndAt: validDate(raw.contractEndAt),
    experienceYears: Math.max(0, Math.min(80, Number(raw.experience) || Number(raw.experienceYears) || 0)),
    aptitudes: attributes,
    history: Array.isArray(raw.history) ? raw.history.slice(0, 80).map((item) => String(item).slice(0, 500)) : [],
    infrastructureRequirements: Array.isArray(raw.demands) ? raw.demands.slice(0, 20).map((item) => String(item).slice(0, 300)) : [],
    expectations: Array.isArray(raw.goals) ? raw.goals.slice(0, 20).map((item) => String(item).slice(0, 300)) : [],
    ambitions: [],
    autonomyLevel: 50,
    hiredAt: validDate(raw.hiredAt),
    morale: Math.max(0, Math.min(100, Number(raw.moral) || 60)),
    workload: Math.max(0, Math.min(100, Number(raw.workload) || 50)),
  };
}

function validDate(value: unknown) {
  if (typeof value !== "string" || !value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function createEmployeeSeeds(clubId: string, employee: ReturnType<typeof sanitizeLegacyEmployee>) {
  if (!employee) throw new Error("invalid_employee");
  const seed = `${clubId}:${employee.legacyId}:${employee.professionalId || employee.name}`;
  const personality = generatePersonality(seed);
  const naturalTalents = generateNaturalTalents(seed, Object.keys(employee.aptitudes));
  const autonomyLevel = Math.round((personality.concepts.autonomy / 5) * 100);
  return {
    personality,
    naturalTalents,
    payload: { ...employee, autonomyLevel, coreConcepts: personality.coreConcepts },
  };
}

export async function processDueState(admin: AdminClient, userId: string, clubId: string) {
  await admin.rpc("process_due_employee_courses", { p_user_id: userId, p_club_id: clubId, p_now: new Date().toISOString() });
  const { data: employees } = await admin.from("employees").select("id").eq("club_id", clubId).eq("status", "active");
  if (!employees?.length) return;
  const ids = employees.map((employee) => employee.id);
  const [{ data: statuses }, { data: concepts }] = await Promise.all([
    admin.from("employee_status").select("*").in("employee_id", ids),
    admin.from("employee_personality_concepts").select("employee_id,concept,level").in("employee_id", ids),
  ]);
  const now = Date.now();
  await Promise.all((statuses || []).map(async (status) => {
    const elapsedDays = Math.floor((now - new Date(status.last_state_processed_at).getTime()) / 86_400_000);
    if (elapsedDays < 1) return;
    const levels = levelsForEmployee(concepts || [], status.employee_id);
    const next = processEmployeeDailyState({
      satisfaction: Number(status.satisfaction_score),
      trust: Number(status.trust_in_leadership),
      morale: Number(status.professional_morale),
      workload: Number(status.workload),
      meetingFatigue: Number(status.meeting_fatigue),
      trainingFatigue: Number(status.training_fatigue),
    }, levels, elapsedDays);
    await admin.from("employee_status").update({
      satisfaction_score: next.satisfaction,
      meeting_fatigue: next.meetingFatigue,
      training_fatigue: next.trainingFatigue,
      last_state_processed_at: new Date().toISOString(),
    }).eq("employee_id", status.employee_id);
  }));
}

export async function buildStaffOverview(admin: AdminClient, userId: string, clubId: string) {
  await processDueState(admin, userId, clubId);
  const { data: employees } = await admin.from("employees")
    .select("id,legacy_id,professional_id,name,role_id,role_label,role_group,status,salary,contract_start_at,contract_end_at,experience_years,aptitudes,temporary_modifiers,autonomy_level,hired_at")
    .eq("club_id", clubId).order("created_at");
  const ids = (employees || []).map((employee) => employee.id);
  const empty = Promise.resolve({ data: [] as Array<Record<string, unknown>> });
  const [statusesResult, conceptsResult, coursesResult, meetingsResult, resultsResult, memoriesResult, promisesResult, advisorsResult, tutorialResult] = await Promise.all([
    ids.length ? admin.from("employee_status").select("*").in("employee_id", ids) : empty,
    ids.length ? admin.from("employee_personality_concepts").select("employee_id,concept,level,is_core").in("employee_id", ids) : empty,
    ids.length ? admin.from("employee_courses").select("*").in("employee_id", ids).order("created_at", { ascending: false }).limit(100) : empty,
    admin.from("meetings").select("id,meeting_type,subject,tone,status,interpretation,completed_at,created_at").eq("club_id", clubId).order("created_at", { ascending: false }).limit(80),
    ids.length ? admin.from("meeting_results").select("*").in("employee_id", ids).order("created_at", { ascending: false }).limit(120) : empty,
    ids.length ? admin.from("employee_memories").select("employee_id,memory_type,importance,summary,structured_data,created_at").in("employee_id", ids).order("created_at", { ascending: false }).limit(160) : empty,
    admin.from("employee_promises").select("*").eq("club_id", clubId).order("created_at", { ascending: false }).limit(100),
    admin.from("advisor_messages").select("*").eq("club_id", clubId).order("created_at", { ascending: false }).limit(120),
    admin.from("tutorial_progress").select("*").eq("club_id", clubId).eq("user_id", userId).maybeSingle(),
  ]);
  const statuses = statusesResult.data || [];
  const concepts = conceptsResult.data || [];
  const results = resultsResult.data || [];
  const memories = memoriesResult.data || [];
  return {
    employees: (employees || []).map((employee) => {
      const status = statuses.find((item) => item.employee_id === employee.id);
      const levels = levelsForEmployee(concepts, employee.id);
      const meetingCount = results.filter((item) => item.employee_id === employee.id).length;
      const memoryCount = memories.filter((item) => item.employee_id === employee.id).length;
      const evidence = Math.min(100, 12 + meetingCount * 12 + memoryCount * 4);
      return {
        ...employee,
        statusMetrics: status ? {
          satisfaction: Number(status.satisfaction_score),
          satisfactionLabel: satisfactionBand(Number(status.satisfaction_score)).label,
          trust: Number(status.trust_in_leadership),
          morale: Number(status.professional_morale),
          workload: Number(status.workload),
          meetingFatigue: Number(status.meeting_fatigue),
          trainingFatigue: Number(status.training_fatigue),
        } : null,
        personality: describePersonality(levels, evidence),
        personalityEvidence: evidence,
        coreConceptCount: concepts.filter((item) => item.employee_id === employee.id && item.is_core).length,
        memories: memories.filter((item) => item.employee_id === employee.id).slice(0, 8),
      };
    }),
    courses: coursesResult.data || [],
    meetings: meetingsResult.data || [],
    meetingResults: results,
    promises: promisesResult.data || [],
    advisors: advisorsResult.data || [],
    tutorial: tutorialResult.data || null,
  };
}

export function levelsForEmployee(rows: Array<Record<string, unknown>>, employeeId: string) {
  const levels = Object.fromEntries(PERSONALITY_CONCEPTS.map((concept) => [concept, 0])) as PersonalityLevels;
  rows.filter((row) => row.employee_id === employeeId).forEach((row) => {
    if (PERSONALITY_CONCEPTS.includes(row.concept as (typeof PERSONALITY_CONCEPTS)[number])) {
      levels[row.concept as (typeof PERSONALITY_CONCEPTS)[number]] = Number(row.level) || 0;
    }
  });
  return levels;
}

export async function createAdvisorMessage(admin: AdminClient, input: {
  clubId: string;
  employeeId?: string | null;
  eventType: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  priority: "low" | "medium" | "high" | "critical";
  tone: "praise" | "suggestion" | "information" | "complaint" | "alert" | "urgent_alert";
  title: string;
  message: string;
  reason?: string;
  recommendation?: string;
  impact?: Record<string, unknown>;
  actions?: Array<Record<string, string>>;
}) {
  const oneHourAgo = new Date(Date.now() - 3_600_000).toISOString();
  const { data: similar } = await admin.from("advisor_messages").select("id,group_count")
    .eq("club_id", input.clubId).eq("event_type", input.eventType)
    .eq("employee_id", input.employeeId || null).in("status", ["new", "read"])
    .gte("created_at", oneHourAgo).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (similar && input.priority !== "critical") {
    await admin.from("advisor_messages").update({
      group_count: Number(similar.group_count) + 1,
      title: input.title,
      message: input.message,
    }).eq("id", similar.id);
    return similar.id;
  }
  if (["low", "medium"].includes(input.priority)) {
    const { count } = await admin.from("advisor_messages").select("id", { count: "exact", head: true })
      .eq("club_id", input.clubId).in("priority", ["low", "medium"]).gte("created_at", oneHourAgo);
    if ((count || 0) >= 3) return null;
  }
  const { data } = await admin.from("advisor_messages").insert({
    club_id: input.clubId,
    employee_id: input.employeeId || null,
    event_type: input.eventType,
    related_entity_type: input.relatedEntityType || null,
    related_entity_id: input.relatedEntityId || null,
    priority: input.priority,
    tone: input.tone,
    title: input.title.slice(0, 180),
    message: input.message.slice(0, 1200),
    reason: input.reason?.slice(0, 1200) || null,
    recommendation: input.recommendation?.slice(0, 1200) || null,
    structured_impact: input.impact || {},
    actions: input.actions || [],
  }).select("id").single();
  return data?.id || null;
}

export type StaffContext = Awaited<ReturnType<typeof getStaffContext>>;
export type StaffEmployeeState = EmployeeState;
