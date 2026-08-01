import { GameWorkspaceHeader } from "@/components/GameWorkspaceHeader";
import { SquadDashboard } from "@/components/SquadDashboard";
import { getGameAccess } from "@/lib/game/access";
import { buildSquadOverview, getPlayerGameContext } from "@/lib/game/players/server";
import { AppPageHeader } from "@/components/AppPageHeader";

export const dynamic = "force-dynamic";

export default async function SquadPage() {
  const access = await getGameAccess({ nextPath: "/elenco" });
  const context = await getPlayerGameContext();
  if (!context.ok || !context.club) throw new Error("player_context_unavailable");
  const overview = await buildSquadOverview(context.admin, context.club.id);
  return <div className="sports-app"><GameWorkspaceHeader clubName={context.club.name} userEmail={access.userEmail} /><main className="sports-page"><AppPageHeader title="Elenco" subtitle="Departamento de futebol e disponibilidade esportiva." breadcrumbs={[{ label: "Elenco" }]} actions={<a className="primary-link" href="/elenco/tatica">Montar escalacao</a>} /><SquadDashboard players={overview.players as never} /></main></div>;
}
