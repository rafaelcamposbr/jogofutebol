import { apiError, apiSuccess, getApiAuthContext } from "@/lib/auth/api";
import { centsToMoney, moneyToCents } from "@/lib/money";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await getApiAuthContext(); if (context.error) return context.error; const { id } = await params;
  const { data: club } = await context.admin.from("clubs").select("id").eq("owner_id", context.user.id).maybeSingle();
  if (!club) return apiError("Clube nao encontrado.", 409);
  const { data, error } = await context.admin.from("player_negotiations").select("id,status,proposed_role,monthly_salary,signing_bonus,contract_months,counter_offer,expires_at,resolved_at,created_at").eq("club_id", club.id).eq("player_id", id).order("created_at", { ascending: false });
  return error ? apiError("Nao foi possivel carregar as negociacoes.", 503) : apiSuccess({ negotiations: data || [] });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await getApiAuthContext(); if (context.error) return context.error; const { id } = await params;
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (body?.action === "accept_counter" && typeof body.negotiationId === "string") {
    const { data, error } = await context.admin.rpc("accept_professional_player_counter", { p_user_id: context.user.id, p_negotiation_id: body.negotiationId });
    if (error) return apiError("A contraproposta nao esta mais disponivel.", 409);
    return apiSuccess({ negotiationId: String(data), status: "accepted" });
  }
  if (body?.action !== "offer") return apiError("Operacao invalida.", 422);
  let salary: number; let bonus: number;
  try { salary = centsToMoney(moneyToCents(String(body.monthlySalary || ""))); bonus = centsToMoney(moneyToCents(String(body.signingBonus || "0"))); }
  catch { return apiError("Informe valores monetarios validos no formato brasileiro.", 422); }
  const role = typeof body.role === "string" ? body.role : ""; const months = Number(body.contractMonths);
  const { data, error } = await context.admin.rpc("offer_professional_player_contract", { p_user_id: context.user.id, p_player_id: id, p_role: role, p_monthly_salary: salary, p_signing_bonus: bonus, p_contract_months: months });
  if (error) {
    if (error.message.includes("active_trial_required")) return apiError("A negociacao profissional exige um contrato de teste ativo.", 409);
    if (error.message.includes("already_open")) return apiError("Ja existe uma negociacao aberta com este jogador.", 409);
    if (error.message.includes("insufficient_funds")) return apiError("Saldo insuficiente para o bonus proposto.", 409);
    return apiError("Nao foi possivel registrar a proposta.", 422);
  }
  return apiSuccess({ negotiation: data });
}
