import { apiError, apiSuccess } from "@/lib/auth/api";
import { getStaffContext } from "@/lib/staff/server";

export async function PATCH(request: Request) {
  const context = await getStaffContext();
  if (!context.ok) return context.error;
  if (!context.club) return apiError("Clube nao encontrado.", 409);
  const body = await request.json().catch(() => null) as { messageId?: string; status?: "read" | "dismissed" | "resolved" } | null;
  if (!body?.messageId || !["read", "dismissed", "resolved"].includes(body.status || "")) return apiError("Acao de orientacao invalida.", 422);
  const now = new Date().toISOString();
  const update = {
    status: body.status,
    read_at: body.status === "read" ? now : undefined,
    resolved_at: body.status === "resolved" ? now : undefined,
  };
  const { data, error } = await context.admin.from("advisor_messages").update(update)
    .eq("id", body.messageId).eq("club_id", context.club.id).select("id").maybeSingle();
  if (error || !data) return apiError("Orientacao nao encontrada.", 404);
  return apiSuccess({ messageId: data.id, status: body.status });
}
