import { apiError, apiSuccess, getApiAuthContext } from "@/lib/auth/api";

export async function GET() {
  const context = await getApiAuthContext();
  if (context.error) return context.error;
  await Promise.all([
    context.admin.rpc("process_due_bankruptcies", { p_now: new Date().toISOString() }),
    context.admin.rpc("process_expired_trial_contracts", { p_now: new Date().toISOString() }),
  ]);
  const [{ data: club }, { data: request }] = await Promise.all([
    context.admin.from("clubs").select("id,name,lifecycle_status,cash_balance,closed_at").eq("owner_id", context.user.id).maybeSingle(),
    context.admin.from("club_bankruptcy_requests").select("id,club_id,status,requested_at,effective_at,cancel_deadline,cancelled_at,completed_at").eq("owner_id", context.user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  return apiSuccess({ club: club || null, request: request || null, serverNow: new Date().toISOString() });
}

export async function POST(request: Request) {
  const context = await getApiAuthContext();
  if (context.error) return context.error;
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (body?.action === "request") {
    if (body.confirmIrreversible !== true || body.confirmAccountPreserved !== true || body.confirmMarketRelease !== true || typeof body.clubName !== "string") {
      return apiError("Confirme todos os efeitos antes de declarar falencia.", 422);
    }
    const { data, error } = await context.admin.rpc("request_club_bankruptcy", { p_user_id: context.user.id, p_club_name: body.clubName });
    if (error) return apiError(error.message.includes("confirmation") ? "O nome digitado nao corresponde ao clube atual." : "Nao foi possivel registrar a declaracao.", 409);
    return apiSuccess({ requestId: String(data) });
  }
  if (body?.action === "cancel" && typeof body.requestId === "string") {
    const { error } = await context.admin.rpc("cancel_club_bankruptcy", { p_user_id: context.user.id, p_request_id: body.requestId });
    if (error) return apiError(error.message.includes("cancellation_closed") ? "O prazo de cancelamento terminou 15 minutos antes do encerramento." : "Nao foi possivel cancelar a declaracao.", 409);
    return apiSuccess();
  }
  return apiError("Operacao invalida.", 422);
}
