import { GameWorkspace } from "@/components/GameWorkspace";
import { SquadDashboard } from "@/components/SquadDashboard";
import { getGameAccess } from "@/lib/game/access";
import { buildSquadOverview, getPlayerGameContext } from "@/lib/game/players/server";
import { AppPageHeader } from "@/components/AppPageHeader";
import { buildTacticalSetup } from "@/lib/game/tactics/server";
import { LegacyGame } from "@/components/LegacyGame";

export const dynamic = "force-dynamic";

export default async function SquadPage() {
  const access = await getGameAccess({ nextPath: "/elenco" });
  if (access.mode !== "authenticated") return <GameWorkspace access={access}><LegacyGame initialState={access.initialState} guest verification={access.verification} /></GameWorkspace>;
  const context = await getPlayerGameContext();
  if (!context.ok || !context.club) throw new Error("player_context_unavailable");
  const [overview, tacticalSetup] = await Promise.all([
    buildSquadOverview(context.admin, context.club.id),
    buildTacticalSetup(context.admin, context.user.id, context.club.id),
  ]);
  return <GameWorkspace access={access}><main className="sports-page"><AppPageHeader title="Elenco" subtitle="Departamento de futebol e disponibilidade esportiva." breadcrumbs={[{ label: "Elenco" }]} actions={<a className="primary-link" href="/elenco/tatica">Montar escalação</a>} /><SquadDashboard players={overview.players as never} tacticalSetup={tacticalSetup} /></main></GameWorkspace>;
}
