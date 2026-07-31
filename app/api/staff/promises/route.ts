import { apiError, apiSuccess } from "@/lib/auth/api";
import { createAdvisorMessage, getStaffContext } from "@/lib/staff/server";

export async function PATCH(request: Request) {
  const context = await getStaffContext();
  if (!context.ok) return context.error;
  if (!context.club) return apiError("Clube nao encontrado.", 409);
  const body = await request.json().catch(() => null) as { promiseId?: string; status?: "fulfilled" | "broken" } | null;
  if (!body?.promiseId || !["fulfilled", "broken"].includes(body.status || "")) return apiError("Acao de promessa invalida.", 422);
  const { data: promise } = await context.admin.from("employee_promises").select("id,employee_id,description,importance,status").eq("id", body.promiseId).eq("club_id", context.club.id).maybeSingle();
  if (!promise || promise.status !== "active") return apiError("Promessa ativa nao encontrada.", 404);
  const { error } = await context.admin.rpc("resolve_employee_promise", {
    p_user_id: context.user.id,
    p_promise_id: promise.id,
    p_status: body.status,
  });
  if (error) return apiError("Nao foi possivel atualizar a promessa.", 409);
  await createAdvisorMessage(context.admin, {
    clubId: context.club.id,
    employeeId: promise.employee_id,
    eventType: `promise_${body.status}`,
    relatedEntityType: "promise",
    relatedEntityId: promise.id,
    priority: body.status === "broken" && Number(promise.importance) >= 4 ? "critical" : "high",
    tone: body.status === "fulfilled" ? "praise" : "urgent_alert",
    title: body.status === "fulfilled" ? "Promessa cumprida" : "Promessa quebrada",
    message: promise.description,
    recommendation: body.status === "fulfilled" ? "O cumprimento fortaleceu a confianca na lideranca." : "Uma conversa particular pode limitar a perda de confianca.",
    impact: { importance: promise.importance, status: body.status },
    actions: [{ label: "Ver promessas", href: "/escritorio/inteligencia?tab=meetings" }],
  });
  return apiSuccess({ promiseId: promise.id, status: body.status });
}
