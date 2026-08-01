import { AppPageHeader } from "@/components/AppPageHeader";
import { GameWorkspace } from "@/components/GameWorkspace";
import { StaffCandidateSearch } from "@/components/StaffCandidateSearch";
import { getGameAccess } from "@/lib/game/access";
import { STAFF_GROUPS, STAFF_ROLES } from "@/lib/game/staff-catalog";

export const dynamic = "force-dynamic";
export default async function StaffSearchPage({ searchParams }: { searchParams: Promise<{ group?: string; role?: string }> }) {
  const access = await getGameAccess({ nextPath: "/escritorio/funcionarios/busca" });
  const params = await searchParams;
  return <GameWorkspace access={access}><main className="sports-page">
    <AppPageHeader title="Buscar funcionarios" subtitle="Filtre o mercado por grupo e funcao." backHref="/escritorio/funcionarios" breadcrumbs={[{ label: "Funcionarios", href: "/escritorio/funcionarios" }, { label: "Busca" }]} />
    <StaffCandidateSearch groups={STAFF_GROUPS} roles={STAFF_ROLES.map((item) => ({ id: item.id, label: item.label, groupId: item.groupId }))} initialGroup={params.group} initialRole={params.role} />
  </main></GameWorkspace>;
}
