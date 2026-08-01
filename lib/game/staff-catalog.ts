export type StaffGroupId = "football" | "medical" | "administrative" | "operations";

export type StaffRole = {
  id: string;
  label: string;
  groupId: StaffGroupId;
  subgroup: string;
  area: string;
  relevance: 1 | 2 | 3 | 4 | 5;
  salaryMin: number;
  salaryMax: number;
  officeRequired: boolean;
  required: boolean;
  reportsTo?: string;
};

export const STAFF_GROUPS = [
  { id: "football", label: "Futebol" },
  { id: "medical", label: "Departamento Medico" },
  { id: "administrative", label: "Administracao" },
  { id: "operations", label: "Operacoes e infraestrutura" },
] as const satisfies ReadonlyArray<{ id: StaffGroupId; label: string }>;

export const STAFF_ROLES: readonly StaffRole[] = [
  role("football-executive", "Executivo de Futebol", "football", "Gestao do futebol", "Gestao", 5, 18_000, 95_000, true, true),
  role("football-supervisor", "Supervisor de Futebol", "football", "Gestao do futebol", "Gestao", 4, 9_000, 48_000, true, false, "football-executive"),
  role("administrative-coordinator", "Coordenador Administrativo", "football", "Gestao do futebol", "Gestao", 3, 7_000, 35_000, true, false, "football-executive"),
  role("supervision-assistant", "Auxiliar de Supervisao", "football", "Gestao do futebol", "Gestao", 2, 4_000, 18_000, true, false, "football-supervisor"),
  role("head-coach", "Tecnico", "football", "Equipe tecnica", "Tatica", 5, 15_000, 180_000, true, true, "football-executive"),
  role("assistant-coach", "Auxiliar Tecnico", "football", "Equipe tecnica", "Lideranca", 3, 7_000, 45_000, true, true, "head-coach"),
  role("youth-coach", "Treinador da Categoria de Base", "football", "Equipe tecnica", "Desenvolvimento de jovens", 3, 6_000, 35_000, true, false, "football-executive"),
  role("fitness-coach", "Preparador Fisico", "football", "Equipe tecnica", "Fisica", 3, 7_000, 42_000, true, true, "head-coach"),
  role("goalkeeper-coach", "Treinador de Goleiros", "football", "Equipe tecnica", "Tecnica", 3, 6_500, 38_000, true, false, "head-coach"),
  role("performance-analysis-coordinator", "Coordenador de Analise de Desempenho", "football", "Equipe tecnica", "Analise", 4, 9_000, 48_000, true, false, "head-coach"),
  role("performance-analyst", "Analista de Desempenho", "football", "Equipe tecnica", "Analise", 3, 6_000, 32_000, true, true, "performance-analysis-coordinator"),
  role("scout", "Olheiro", "football", "Equipe tecnica", "Observacao", 3, 6_000, 42_000, true, true, "football-executive"),
  role("doctor", "Medico", "medical", "Saude", "Medica", 5, 18_000, 85_000, false, true),
  role("psychologist", "Psicologo", "medical", "Saude", "Medica", 3, 7_000, 35_000, false, false, "doctor"),
  role("physiologist", "Fisiologista", "medical", "Saude", "Fisica", 3, 8_000, 40_000, false, false, "doctor"),
  role("physiotherapy-coordinator", "Coordenador de Fisioterapia", "medical", "Saude", "Medica", 4, 10_000, 48_000, false, false, "doctor"),
  role("physiotherapist", "Fisioterapeuta", "medical", "Saude", "Medica", 3, 7_000, 36_000, false, true, "physiotherapy-coordinator"),
  role("nurse", "Enfermeiro", "medical", "Saude", "Medica", 2, 5_000, 22_000, false, false, "doctor"),
  role("masseur", "Massagista", "medical", "Saude", "Medica", 2, 4_000, 18_000, false, false, "physiotherapy-coordinator"),
  role("podiatrist", "Podologo", "medical", "Saude", "Medica", 2, 5_000, 24_000, false, false, "doctor"),
  role("nutritionist", "Nutricionista", "medical", "Saude", "Medica", 3, 7_000, 34_000, false, false, "doctor"),
  role("financial-director", "Diretor Financeiro", "administrative", "Financeiro", "Financas", 5, 14_000, 70_000, true, true),
  role("accountant", "Contador", "administrative", "Financeiro", "Financas", 3, 6_000, 28_000, true, true, "financial-director"),
  role("lawyer", "Advogado", "administrative", "Juridico", "Negociacao", 4, 9_000, 55_000, true, true),
  role("admin-manager", "Gerente Administrativo", "administrative", "Administrativo", "Gestao", 4, 9_000, 44_000, true, true),
  role("marketing-manager", "Responsavel por Marketing", "administrative", "Comercial", "Marketing", 3, 7_000, 38_000, true, true),
  role("press-officer", "Assessor de Imprensa", "administrative", "Comunicacao", "Marketing", 3, 6_000, 30_000, true, false),
  role("property-manager", "Gestor de Patrimonio", "operations", "Infraestrutura", "Gestao", 4, 8_000, 40_000, true, false),
  role("groundskeeper", "Responsavel pelo Gramado", "operations", "Infraestrutura", "Gestao", 2, 4_000, 18_000, false, false, "property-manager"),
  role("maintenance-staff", "Funcionario de Manutencao", "operations", "Infraestrutura", "Gestao", 2, 3_500, 16_000, false, true, "property-manager"),
  role("security", "Seguranca", "operations", "Operacao", "Lideranca", 2, 3_500, 15_000, false, false),
  role("kitman", "Roupeiro", "operations", "Operacao", "Gestao", 2, 3_500, 15_000, false, false),
] as const;

function role(
  id: string,
  label: string,
  groupId: StaffGroupId,
  subgroup: string,
  area: string,
  relevance: 1 | 2 | 3 | 4 | 5,
  salaryMin: number,
  salaryMax: number,
  officeRequired: boolean,
  required: boolean,
  reportsTo?: string,
): StaffRole {
  return { id, label, groupId, subgroup, area, relevance, salaryMin, salaryMax, officeRequired, required, reportsTo };
}

export function getStaffGroup(groupId: string | null | undefined) {
  return STAFF_GROUPS.find((group) => group.id === groupId) || null;
}

export function getStaffRole(roleId: string | null | undefined) {
  return STAFF_ROLES.find((item) => item.id === roleId) || null;
}

export function rolesForGroup(groupId: string | null | undefined) {
  return groupId ? STAFF_ROLES.filter((item) => item.groupId === groupId) : [];
}

export function isRoleInGroup(roleId: string | null | undefined, groupId: string | null | undefined) {
  const item = getStaffRole(roleId);
  return Boolean(item && groupId && item.groupId === groupId);
}

export function suggestedStaffSalary(roleItem: StaffRole, aptitude: number) {
  const normalized = Math.max(0, Math.min(100, Number(aptitude) || 0)) / 100;
  const value = roleItem.salaryMin + (roleItem.salaryMax - roleItem.salaryMin) * normalized ** 1.6;
  return Math.round(value * 100) / 100;
}
