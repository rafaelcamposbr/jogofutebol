import { apiError, apiSuccess } from "@/lib/auth/api";
import { getScoutingContext, getTryoutDetail } from "@/lib/game/scouting/server";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await getScoutingContext();
  if (!context.ok) return context.error;
  if (!context.club) return apiError("Clube nao encontrado.", 409);
  const { id } = await params;
  try {
    const tryout = await getTryoutDetail(context.admin, context.user.id, context.club.id, id);
    return tryout ? apiSuccess({ tryout, serverNow: new Date().toISOString() }) : apiError("Peneira nao encontrada.", 404);
  } catch {
    return apiError("Nao foi possivel carregar a peneira.", 503);
  }
}
