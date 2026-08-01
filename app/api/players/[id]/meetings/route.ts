import { apiError, apiSuccess } from "@/lib/auth/api";
import { calculatePlayerReaction } from "@/lib/game/players/engine";
import { getPlayerGameContext } from "@/lib/game/players/server";
import { clamp } from "@/lib/game/random";
import { applyPlayerRelationshipEvent, ensurePlayerRelationships } from "@/lib/game/relationships/server";

export async function POST(request: Request, contextValue: { params: Promise<{ id: string }> }) {
  const context = await getPlayerGameContext();
  if (!context.ok) return context.error;
  if (!context.club) return apiError("Clube nao encontrado.", 409);
  const { id: playerId } = await contextValue.params;
  const body = await request.json().catch(() => null) as { subject?: string; text?: string } | null;
  const subject = body?.subject?.trim().slice(0, 180) || "";
  const text = body?.text?.trim().slice(0, 5000) || "";
  if (subject.length < 3 || text.length < 3) return apiError("Informe assunto e mensagem para a reuniao.", 422);
  const [{ data: player }, { data: state }, { data: concepts }] = await Promise.all([
    context.admin.from("players").select("id,known_as,squad_role").eq("id", playerId).eq("club_id", context.club.id).maybeSingle(),
    context.admin.from("player_status").select("*").eq("player_id", playerId).maybeSingle(),
    context.admin.from("player_personality_concepts").select("concept,level").eq("player_id", playerId),
  ]);
  if (!player || !state) return apiError("Jogador nao encontrado.", 404);
  const personality = Object.fromEntries((concepts || []).map((item) => [item.concept, Number(item.level)]));
  const reaction = calculatePlayerReaction({ text, personality, morale: Number(state.morale), satisfaction: Number(state.club_satisfaction) });
  const typeMap: Record<string, string> = { praise: "praise", accountability: "accountability", promise: "private", contract: "contract", transfer: "negotiation", playing_time: "evaluation", motivation: "feedback" };
  const { data: meeting, error } = await context.admin.from("meetings").insert({
    club_id: context.club.id, created_by: context.user.id, meeting_type: typeMap[reaction.classification] || "private",
    subject, original_text: text, tone: reaction.tone === "receptive" ? "supportive" : reaction.tone === "resistant" ? "direct" : "respectful",
    status: "completed", interpretation: { classification: reaction.classification, source: "deterministic_fallback" },
    started_at: new Date().toISOString(), completed_at: new Date().toISOString(),
  }).select("id").single();
  if (error || !meeting) return apiError("Nao foi possivel registrar a reuniao.", 500);
  const participantResult = await context.admin.from("meeting_participants").insert([
    { meeting_id: meeting.id, participant_type: "user", participant_id: context.user.id, role_in_meeting: "organizer" },
    { meeting_id: meeting.id, participant_type: "player", participant_id: player.id, role_in_meeting: "participant" },
  ]);
  if (participantResult.error) return apiError("Nao foi possivel registrar os participantes.", 500);
  const result = await context.admin.from("player_meeting_results").insert({
    meeting_id: meeting.id, player_id: player.id, classification: reaction.classification,
    morale_delta: reaction.moraleDelta, confidence_delta: reaction.confidenceDelta,
    satisfaction_delta: reaction.satisfactionDelta, coach_trust_delta: reaction.coachTrustDelta,
    leadership_trust_delta: reaction.leadershipTrustDelta, transfer_intent_delta: reaction.transferIntentDelta,
    structured_reaction: reaction,
  });
  if (result.error) return apiError("O motor recusou os efeitos calculados.", 422);
  const nextState = {
    morale: clamp(Number(state.morale) + reaction.moraleDelta), confidence: clamp(Number(state.confidence) + reaction.confidenceDelta),
    club_satisfaction: clamp(Number(state.club_satisfaction) + reaction.satisfactionDelta), coach_trust: clamp(Number(state.coach_trust) + reaction.coachTrustDelta),
    leadership_trust: clamp(Number(state.leadership_trust) + reaction.leadershipTrustDelta), transfer_intent: clamp(Number(state.transfer_intent) + reaction.transferIntentDelta),
  };
  await context.admin.from("player_status").update(nextState).eq("player_id", player.id);
  const memoryResult = await context.admin.from("player_memories").insert({
    player_id: player.id, memory_type: reaction.classification, importance: reaction.promiseCreated ? 4 : Math.abs(reaction.moraleDelta) >= 3 ? 3 : 2,
    emotional_weight: reaction.moraleDelta, summary: subject, related_person_type: "user", related_person_id: context.user.id,
    deadline: reaction.promiseCreated ? new Date(Date.now() + 90 * 86_400_000).toISOString() : null,
    structured_data: { meetingId: meeting.id, reactionTone: reaction.tone },
  });
  if (memoryResult.error) return apiError("A reuniao ocorreu, mas a memoria nao foi salva.", 500);
  if (reaction.promiseCreated) await context.admin.from("player_promises").insert({
    player_id: player.id, club_id: context.club.id, meeting_id: meeting.id, promise_type: "meeting_commitment",
    description: text.slice(0, 600), deadline: new Date(Date.now() + 90 * 86_400_000).toISOString(), importance: 4,
  });
  await context.admin.from("player_relationships").upsert({
    player_id: player.id, target_type: "user", target_id: context.user.id,
    affinity: clamp(50 + reaction.moraleDelta), trust: clamp(50 + reaction.leadershipTrustDelta), respect: clamp(50 + reaction.coachTrustDelta),
    conflict: clamp(reaction.moraleDelta < 0 ? Math.abs(reaction.moraleDelta) : 0), influence: 30,
  }, { onConflict: "player_id,target_type,target_id" });
  await ensurePlayerRelationships(context.admin, context.club.id, player.id);
  await applyPlayerRelationshipEvent(context.admin, {
    clubId: context.club.id, sourceType: "user", sourceId: context.user.id, playerId: player.id,
    eventType: reaction.classification,
    deltas: { familiarity: 3, affinity: reaction.moraleDelta * 0.5, trust: reaction.leadershipTrustDelta, respect: reaction.coachTrustDelta, tension: reaction.moraleDelta < 0 ? Math.abs(reaction.moraleDelta) : -1 },
    severity: Math.abs(reaction.moraleDelta) >= 5 ? 4 : 2,
  });
  return apiSuccess({ meetingId: meeting.id, reaction, nextState, source: "deterministic_fallback" });
}
