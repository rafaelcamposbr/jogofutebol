import { apiError, apiSuccess } from "@/lib/auth/api";
import { createEmployeeSeeds, getStaffContext, sanitizeLegacyEmployee } from "@/lib/staff/server";

export async function POST(request: Request) {
  const context = await getStaffContext();
  if (!context.ok) return context.error;
  if (!context.club) return apiError("Crie um clube antes de sincronizar funcionarios.", 409);
  const body = await request.json().catch(() => null) as { employees?: unknown[] } | null;
  if (!Array.isArray(body?.employees) || body.employees.length > 120) {
    return apiError("Lista de funcionarios invalida.", 422);
  }

  let synced = 0;
  const rejected: number[] = [];
  for (const [index, raw] of body.employees.entries()) {
    const employee = sanitizeLegacyEmployee(raw);
    if (!employee) { rejected.push(index); continue; }
    const seeds = createEmployeeSeeds(context.club.id, employee);
    const { error } = await context.admin.rpc("sync_legacy_employee", {
      p_user_id: context.user.id,
      p_club_id: context.club.id,
      p_employee: seeds.payload,
      p_concepts: seeds.personality.concepts,
      p_talents: seeds.naturalTalents,
    });
    if (error) rejected.push(index);
    else synced += 1;
  }
  return apiSuccess({ synced, rejected });
}
