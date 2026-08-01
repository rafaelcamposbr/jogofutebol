import { GameWorkspace } from "@/components/GameWorkspace";
import { AppPageHeader } from "@/components/AppPageHeader";
import { TacticsBoard } from "@/components/TacticsBoard";
import { getGameAccess } from "@/lib/game/access";
import { getPlayerGameContext } from "@/lib/game/players/server";
import { buildTacticalSetup } from "@/lib/game/tactics/server";

export const dynamic = "force-dynamic";

export default async function TacticsPage() {
  const access = await getGameAccess({ nextPath: "/elenco/tatica" }); const context = await getPlayerGameContext();
  if (!context.ok || !context.club) throw new Error("player_context_unavailable");
  const setup = await buildTacticalSetup(context.admin, context.user.id, context.club.id);
  return <GameWorkspace access={access}><main className="sports-page wide"><AppPageHeader title="Tática e escalação" subtitle="Formação, instruções e seleção ativa." backHref="/elenco" breadcrumbs={[{ label: "Elenco", href: "/elenco" }, { label: "Tática" }]} /><TacticsBoard setup={setup} /></main></GameWorkspace>;
}
