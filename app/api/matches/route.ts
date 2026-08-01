import { apiError, apiSuccess } from "@/lib/auth/api";
import { createQaMatch } from "@/lib/game/matches/server";
import { getPlayerGameContext } from "@/lib/game/players/server";

export async function POST() {
  const context = await getPlayerGameContext();
  if (!context.ok) return context.error;
  if (!context.club) return apiError("Clube nao encontrado.", 409);
  const matchId = await createQaMatch(context.admin, context.user.id, context.club);
  return apiSuccess({ matchId });
}
