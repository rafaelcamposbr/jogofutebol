import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { initialRelationship, personalityCompatibility } from "@/lib/game/relationships/engine";

export async function ensurePlayerRelationships(admin: SupabaseClient, clubId: string, playerId: string) {
  const [{ data: club }, { data: playerConceptRows }, { data: employees }] = await Promise.all([
    admin.from("clubs").select("owner_id").eq("id", clubId).maybeSingle(),
    admin.from("player_personality_concepts").select("concept,level").eq("player_id", playerId),
    admin.from("employees").select("id").eq("club_id", clubId).eq("status", "active").limit(40),
  ]);
  if (!club?.owner_id) return;
  const playerPersonality = Object.fromEntries((playerConceptRows || []).map((item) => [item.concept, Number(item.level)]));
  const targets = [{ sourceType: "user", sourceId: club.owner_id, personality: { leadership: 3, ambition: 3, discipline: 3 } }];
  if (employees?.length) {
    const { data: concepts } = await admin.from("employee_personality_concepts").select("employee_id,concept,level").in("employee_id", employees.map((item) => item.id));
    employees.forEach((employee) => targets.push({
      sourceType: "employee", sourceId: employee.id,
      personality: Object.fromEntries((concepts || []).filter((item) => item.employee_id === employee.id).map((item) => [item.concept, Number(item.level)])),
    }));
  }
  const rows = targets.map((target) => {
    const compatibility = personalityCompatibility(target.personality, playerPersonality);
    const state = initialRelationship(compatibility);
    return {
      club_id: clubId, source_type: target.sourceType, source_id: target.sourceId, target_type: "player", target_id: playerId,
      familiarity: state.familiarity, affinity: state.affinity, trust: state.trust, respect: state.respect,
      tension: state.tension, professional_alignment: state.professionalAlignment, influence: state.influence, compatibility_base: state.compatibilityBase,
    };
  });
  if (rows.length) await admin.from("character_relationships").upsert(rows, { onConflict: "club_id,source_type,source_id,target_type,target_id", ignoreDuplicates: true });
}

export async function applyPlayerRelationshipEvent(admin: SupabaseClient, input: { clubId: string; sourceType: "user" | "employee"; sourceId: string; playerId: string; eventType: string; deltas: Record<string, number>; severity?: number }) {
  const { data: relationship } = await admin.from("character_relationships").select("id,affinity,trust,respect,tension,familiarity,professional_alignment,influence").eq("club_id", input.clubId).eq("source_type", input.sourceType).eq("source_id", input.sourceId).eq("target_type", "player").eq("target_id", input.playerId).maybeSingle();
  if (!relationship) return;
  const cap = (input.severity || 1) >= 4 ? 18 : 5;
  const update = (key: string) => Math.max(0, Math.min(100, Number((relationship as Record<string, unknown>)[key] || 0) + Math.max(-cap, Math.min(cap, Number(input.deltas[key] || 0)))));
  await admin.from("character_relationships").update({ affinity: update("affinity"), trust: update("trust"), respect: update("respect"), tension: update("tension"), familiarity: update("familiarity"), professional_alignment: update("professional_alignment"), updated_at: new Date().toISOString() }).eq("id", relationship.id);
  await admin.from("relationship_events").insert({ relationship_id: relationship.id, event_type: input.eventType, deltas: input.deltas, severity: input.severity || 1 });
}
