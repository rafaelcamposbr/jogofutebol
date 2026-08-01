import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { apiError, getApiAuthContext } from "@/lib/auth/api";
import { buildConsensus, estimateHiddenCategory, reportAgeStatus, reportPrecision, reportUncertainty, type ReportInputs } from "@/lib/game/reports/engine";

type AdminClient = SupabaseClient;

export async function createPlayerReport(playerId: string, authorId: string) {
  const context = await getApiAuthContext();
  if (context.error) return { ok: false as const, error: context.error };
  const { data: club } = await context.admin.from("clubs").select("id").eq("owner_id", context.user.id).maybeSingle();
  if (!club) return { ok: false as const, error: apiError("Clube nao encontrado.", 409) };
  const [{ data: player }, { data: attributes }, { data: hidden }, { data: author }, { count: versionCount }, { data: relationship }] = await Promise.all([
    context.admin.from("players").select("id,club_id,status,main_position,known_as").eq("id", playerId).maybeSingle(),
    context.admin.from("player_attributes").select("technical,mental,physical,goalkeeping").eq("player_id", playerId).maybeSingle(),
    context.admin.from("player_hidden_traits").select("potential_ceiling").eq("player_id", playerId).maybeSingle(),
    context.admin.from("employees").select("id,name,role_id,role_label,aptitudes,status").eq("id", authorId).eq("club_id", club.id).eq("status", "active").maybeSingle(),
    context.admin.from("player_reports").select("id", { count: "exact", head: true }).eq("club_id", club.id).eq("player_id", playerId).eq("author_employee_id", authorId),
    context.admin.from("character_relationships").select("familiarity,affinity,tension").eq("club_id", club.id).eq("source_type", "employee").eq("source_id", authorId).eq("target_type", "player").eq("target_id", playerId).maybeSingle(),
  ]);
  if (!player || !attributes || !hidden || !author) return { ok: false as const, error: apiError("Jogador ou autor indisponivel para este relatorio.", 404) };
  const allowed = player.club_id === club.id || player.status === "tryout_candidate" || player.status === "on_trial";
  if (!allowed) return { ok: false as const, error: apiError("O clube nao possui acesso a este jogador.", 403) };
  const roleKey = author.role_id === "scout" ? "scouting" : author.role_id.includes("analyst") ? "analysis" : "technical";
  const functionalAptitude = Number(author.aptitudes?.[roleKey] || author.aptitudes?.scouting || 45);
  const familiarity = Number(relationship?.familiarity || 10);
  const relationshipBias = ((Number(relationship?.affinity || 50) - 50) - Number(relationship?.tension || 0) * 0.25) / 20;
  const now = new Date().toISOString();
  const version = Number(versionCount || 0) + 1;
  const input: ReportInputs = { authorId, playerId, version, date: now, functionalAptitude, familiarity, observationQuality: 58, dataQuality: 55, relationshipBias };
  const precision = reportPrecision(input);
  const grouped = attributes as Record<string, Record<string, number>>;
  const mean = (group: Record<string, number> | undefined) => Object.values(group || {}).reduce((sum, value) => sum + Number(value), 0) / Math.max(1, Object.keys(group || {}).length);
  const realValues = {
    technical: mean(grouped.technical), mental: mean(grouped.mental), physical: mean(grouped.physical),
    ...(player.main_position === "GK" ? { goalkeeping: mean(grouped.goalkeeping) } : {}), potential: Number(hidden.potential_ceiling),
  };
  const estimates = Object.entries(realValues).map(([category, value]) => estimateHiddenCategory(value, category, input));
  const ageStatus = reportAgeStatus(now, precision);
  const { data: report, error } = await context.admin.from("player_reports").insert({
    club_id: club.id, player_id: playerId, author_employee_id: author.id, author_name: author.name, author_role: author.role_label,
    report_version: version, precision, uncertainty: reportUncertainty(precision), confidence_label: confidenceLabel(precision), age_status: ageStatus,
    summary: precision >= 70 ? "Observacao consistente, sustentada por boa familiaridade e dados suficientes." : "Leitura preliminar; as faixas permanecem amplas e exigem novas observacoes.",
    caveats: precision < 50 ? ["Amostra curta", "Maior risco de impressao por lances isolados"] : ["Estimativas nao substituem acompanhamento continuo"],
    recommendation: estimates.some((item) => item.central >= 68) ? "Manter em observacao prioritaria" : precision < 50 ? "Solicitar nova avaliacao" : "Acompanhar evolucao",
    valid_until: new Date(Date.now() + (precision >= 70 ? 90 : 30) * 86_400_000).toISOString(),
  }).select("id").single();
  if (error || !report) return { ok: false as const, error: apiError("Nao foi possivel registrar o relatorio.", 503) };
  await context.admin.from("player_report_estimates").insert(estimates.map((item) => ({
    report_id: report.id, category: item.category, estimate_label: item.label,
    lower_bound: item.lower, upper_bound: item.upper, central_estimate: item.central,
  })));
  await refreshConsensus(context.admin, club.id, playerId);
  return { ok: true as const, reportId: report.id };
}

export async function listPlayerReports(admin: AdminClient, clubId: string, playerId: string) {
  const { data: reports, error } = await admin.from("player_reports")
    .select("id,author_employee_id,author_name,author_role,report_version,precision,uncertainty,confidence_label,age_status,summary,caveats,recommendation,created_at,valid_until")
    .eq("club_id", clubId).eq("player_id", playerId).order("created_at", { ascending: false });
  if (error) throw error;
  const ids = (reports || []).map((item) => item.id);
  const { data: estimates } = ids.length ? await admin.from("player_report_estimates").select("report_id,category,estimate_label,lower_bound,upper_bound").in("report_id", ids) : { data: [] };
  return (reports || []).map((report) => ({ ...report, estimates: (estimates || []).filter((item) => item.report_id === report.id) }));
}

async function refreshConsensus(admin: AdminClient, clubId: string, playerId: string) {
  const { data: reports } = await admin.from("player_reports").select("id,precision").eq("club_id", clubId).eq("player_id", playerId);
  if (!reports?.length) return;
  const { data: estimates } = await admin.from("player_report_estimates").select("report_id,category,central_estimate").in("report_id", reports.map((item) => item.id));
  const categories = [...new Set((estimates || []).map((item) => item.category))];
  const rows = categories.flatMap((category) => {
    const values = (estimates || []).filter((item) => item.category === category).map((item) => ({ central: Number(item.central_estimate), precision: Number(reports.find((report) => report.id === item.report_id)?.precision || 10) }));
    const consensus = buildConsensus(values);
    return consensus ? [{ club_id: clubId, player_id: playerId, category, consensus_label: consensus.label, lower_bound: consensus.lower, upper_bound: consensus.upper, confidence: consensus.confidence, divergence: consensus.divergence, updated_at: new Date().toISOString() }] : [];
  });
  if (rows.length) await admin.from("player_report_consensus").upsert(rows, { onConflict: "club_id,player_id,category" });
}

function confidenceLabel(value: number) {
  if (value >= 80) return "Alta";
  if (value >= 60) return "Boa";
  if (value >= 40) return "Moderada";
  return "Baixa";
}
