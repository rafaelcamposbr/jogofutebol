import { apiError, apiSuccess } from "@/lib/auth/api";
import { processMatch } from "@/lib/game/matches/server";
import { getPlayerGameContext } from "@/lib/game/players/server";

export async function POST(_request: Request, contextValue: { params: Promise<{ id: string }> }) {
  const context = await getPlayerGameContext(); if (!context.ok) return context.error;
  const { id } = await contextValue.params;
  const view = await processMatch(context.admin, context.user.id, id);
  return view ? apiSuccess({ view }) : apiError("Partida nao encontrada.", 404);
}
