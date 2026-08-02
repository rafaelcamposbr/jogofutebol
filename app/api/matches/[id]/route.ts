import { apiError, apiSuccess } from "@/lib/auth/api";
import { getMatchView, saveMatchPreparation } from "@/lib/game/matches/server";
import { getPlayerGameContext } from "@/lib/game/players/server";

export async function GET(_request: Request, contextValue: { params: Promise<{ id: string }> }) {
  const context = await getPlayerGameContext(); if (!context.ok) return context.error;
  const { id } = await contextValue.params;
  const view = await getMatchView(context.admin, context.user.id, id);
  return view ? apiSuccess({ view }) : apiError("Partida nao encontrada.", 404);
}

export async function POST(request: Request, contextValue: { params: Promise<{ id: string }> }) {
  const context = await getPlayerGameContext(); if (!context.ok) return context.error;
  const { id } = await contextValue.params;
  const body = await request.json().catch(() => null) as { plan?: unknown; assignments?: unknown } | null;
  const result = await saveMatchPreparation(context.admin, context.user.id, id, { plan: body?.plan, assignments: body?.assignments });
  return result.ok ? apiSuccess(result) : apiError(result.message || "Preparacao recusada.", 422);
}
