import { apiError, apiSuccess } from "@/lib/auth/api";
import { POSITIONS } from "@/lib/game/players/config";
import { TRYOUT_FOCUSES, type TryoutFocus, type TryoutPreferences } from "@/lib/game/scouting/engine";
import { getScoutingContext, listScouts, listTryouts, startTryout } from "@/lib/game/scouting/server";

export async function GET() {
  const context = await getScoutingContext();
  if (!context.ok) return context.error;
  if (!context.club) return apiError("Clube nao encontrado.", 409);
  try {
    const [tryouts, scouts] = await Promise.all([
      listTryouts(context.admin, context.user.id, context.club.id),
      listScouts(context.admin, context.club.id),
    ]);
    return apiSuccess({ tryouts, scouts, serverNow: new Date().toISOString() });
  } catch {
    return apiError("Nao foi possivel carregar as peneiras.", 503);
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const scoutId = typeof body?.scoutId === "string" ? body.scoutId : "";
  const days = Number(body?.days);
  const focus = typeof body?.focus === "string" && TRYOUT_FOCUSES.includes(body.focus as TryoutFocus) ? body.focus as TryoutFocus : null;
  const positions = Array.isArray(body?.positions) ? body.positions.filter((item): item is (typeof POSITIONS)[number] => typeof item === "string" && POSITIONS.includes(item as (typeof POSITIONS)[number])) : [];
  if (!scoutId || !Number.isInteger(days) || days < 1 || days > 30 || !focus) return apiError("Configuracao de peneira invalida.", 422);
  const ageMin = Math.max(14, Math.min(40, Number(body?.ageMin) || 16));
  const ageMax = Math.max(ageMin, Math.min(45, Number(body?.ageMax) || 24));
  const preferences: TryoutPreferences = {
    ageMin, ageMax, positions, focus,
    maxPerPosition: Math.max(1, Math.min(50, Number(body?.maxPerPosition) || 8)),
    region: typeof body?.region === "string" ? body.region.slice(0, 80) : undefined,
    comments: typeof body?.comments === "string" ? body.comments.slice(0, 600) : undefined,
  };
  const result = await startTryout({ scoutId, days, preferences });
  if (!result.ok) return result.error;
  return apiSuccess({ id: result.id });
}
