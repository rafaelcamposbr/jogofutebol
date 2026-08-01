import { apiError, apiSuccess, getApiAuthContext } from "@/lib/auth/api";
import { createPlayerReport, listPlayerReports } from "@/lib/game/reports/server";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await getApiAuthContext();
  if (context.error) return context.error;
  const { id } = await params;
  const { data: club } = await context.admin.from("clubs").select("id").eq("owner_id", context.user.id).maybeSingle();
  if (!club) return apiError("Clube nao encontrado.", 409);
  try { return apiSuccess({ reports: await listPlayerReports(context.admin, club.id, id) }); }
  catch { return apiError("Nao foi possivel carregar os relatorios.", 503); }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null) as { authorId?: string } | null;
  if (!body?.authorId) return apiError("Selecione o autor do relatorio.", 422);
  const result = await createPlayerReport(id, body.authorId);
  if (!result.ok) return result.error;
  return apiSuccess({ reportId: result.reportId });
}
