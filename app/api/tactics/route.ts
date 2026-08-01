import { apiError, apiSuccess } from "@/lib/auth/api";
import { getPlayerGameContext } from "@/lib/game/players/server";
import { FORMATIONS, type Formation, type Mentality } from "@/lib/game/tactics/engine";
import { buildTacticalSetup, saveTacticalSetup } from "@/lib/game/tactics/server";

export async function GET() {
  const context = await getPlayerGameContext();
  if (!context.ok) return context.error;
  if (!context.club) return apiError("Clube nao encontrado.", 409);
  const setup = await buildTacticalSetup(context.admin, context.user.id, context.club.id);
  return apiSuccess({ setup });
}

export async function PUT(request: Request) {
  const context = await getPlayerGameContext();
  if (!context.ok) return context.error;
  if (!context.club) return apiError("Clube nao encontrado.", 409);
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const formation = String(body?.formation || "") as Formation;
  const mentality = String(body?.mentality || "") as Mentality;
  if (!FORMATIONS.includes(formation) || !["very_defensive", "defensive", "balanced", "attacking", "very_attacking"].includes(mentality)) {
    return apiError("Formacao ou mentalidade invalida.", 422);
  }
  const assignments = Array.isArray(body?.assignments) ? body.assignments.slice(0, 18).map((item) => {
    const row = item as Record<string, unknown>;
    return { slotKey: String(row.slotKey || ""), playerId: String(row.playerId || ""), position: String(row.position || "") as never, role: String(row.role || ""), isStarter: row.isStarter !== false, benchOrder: Number(row.benchOrder) || null };
  }) : [];
  const result = await saveTacticalSetup(context.admin, {
    ownerId: context.user.id, clubId: context.club.id, tacticId: String(body?.tacticId || ""), lineupId: String(body?.lineupId || ""),
    formation, mentality, assignments,
    inPossession: body?.inPossession && typeof body.inPossession === "object" ? body.inPossession as Record<string, unknown> : {},
    transitions: body?.transitions && typeof body.transitions === "object" ? body.transitions as Record<string, unknown> : {},
    outOfPossession: body?.outOfPossession && typeof body.outOfPossession === "object" ? body.outOfPossession as Record<string, unknown> : {},
  });
  if (!result.valid) return apiError(result.errors[0] || "Escalacao invalida.", 422, { lineup: result.errors.join(" ") });
  return apiSuccess({ message: "Plano tatico salvo." });
}
