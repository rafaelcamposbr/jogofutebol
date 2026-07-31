import { apiError, apiSuccess } from "@/lib/auth/api";
import { buildStaffOverview, getStaffContext } from "@/lib/staff/server";

export async function GET() {
  const context = await getStaffContext();
  if (!context.ok) return context.error;
  if (!context.club) return apiError("Clube nao encontrado.", 409);
  const overview = await buildStaffOverview(context.admin, context.user.id, context.club.id);
  return apiSuccess({ club: context.club, ...overview });
}
