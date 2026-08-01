import { apiError, apiSuccess } from "@/lib/auth/api";
import { getStaffGroup, getStaffRole, isRoleInGroup, rolesForGroup, suggestedStaffSalary } from "@/lib/game/staff-catalog";
import { createSeededRandom, deterministicUuid } from "@/lib/game/random";
import { getStaffContext } from "@/lib/staff/server";

const FIRST_NAMES = ["Amanda", "Bruno", "Camila", "Diego", "Eduardo", "Fernanda", "Gustavo", "Helena", "Marcos", "Renata", "Samuel", "Tatiane"];
const LAST_NAMES = ["Almeida", "Barros", "Campos", "Dias", "Freitas", "Lopes", "Martins", "Nogueira", "Queiroz", "Rezende", "Teixeira", "Vieira"];

export async function GET(request: Request) {
  const context = await getStaffContext();
  if (!context.ok) return context.error;
  if (!context.club) return apiError("Clube nao encontrado.", 409);
  const url = new URL(request.url);
  const groupId = url.searchParams.get("group") || "";
  const roleId = url.searchParams.get("role") || "";
  if (!groupId) return apiSuccess({ candidates: [], roles: [], selectedGroup: null, selectedRole: null });
  const group = getStaffGroup(groupId);
  if (!group) return apiError("Grupo de funcionarios invalido.", 422);
  if (roleId && !isRoleInGroup(roleId, groupId)) return apiError("A funcao nao pertence ao grupo selecionado.", 422);
  const roles = roleId ? [getStaffRole(roleId)!] : rolesForGroup(groupId);
  const candidates = roles.flatMap((role, roleIndex) => Array.from({ length: 3 }, (_, index) => {
    const random = createSeededRandom(`${context.club!.id}:${role.id}:${index}`);
    const aptitude = random.int(34, 92);
    const experience = random.int(1, 24);
    return {
      id: deterministicUuid(`staff-candidate:${context.club!.id}:${role.id}:${index}`),
      name: `${random.pick(FIRST_NAMES)} ${random.pick(LAST_NAMES)}`,
      groupId: role.groupId,
      groupLabel: group.label,
      roleId: role.id,
      roleLabel: role.label,
      subgroup: role.subgroup,
      relevance: role.relevance,
      aptitude,
      experience,
      suggestedSalary: suggestedStaffSalary(role, aptitude),
      salaryMin: role.salaryMin,
      salaryMax: role.salaryMax,
      city: ["Campinas", "Santos", "Curitiba", "Belo Horizonte", "Recife", "Porto Alegre"][(roleIndex + index) % 6],
    };
  }));
  return apiSuccess({ candidates, roles: rolesForGroup(groupId), selectedGroup: groupId, selectedRole: roleId || null });
}
