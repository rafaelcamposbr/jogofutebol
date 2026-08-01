import { apiError, apiSuccess } from "@/lib/auth/api";
import { startMatch } from "@/lib/game/matches/server";
import { getPlayerGameContext } from "@/lib/game/players/server";

export async function POST(_request: Request, contextValue: { params: Promise<{ id: string }> }) {
  const context = await getPlayerGameContext(); if (!context.ok) return context.error;
  const { id } = await contextValue.params;
  const started = await startMatch(context.admin, context.user.id, id);
  return started ? apiSuccess() : apiError("A partida nao pode ser iniciada.", 409);
}
