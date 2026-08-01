import { GameWorkspaceHeader } from "@/components/GameWorkspaceHeader";
import { TacticsBoard } from "@/components/TacticsBoard";
import { getGameAccess } from "@/lib/game/access";
import { getPlayerGameContext } from "@/lib/game/players/server";
import { buildTacticalSetup } from "@/lib/game/tactics/server";

export const dynamic = "force-dynamic";

export default async function TacticsPage() {
  const access = await getGameAccess({ nextPath: "/elenco/tatica" }); const context = await getPlayerGameContext();
  if (!context.ok || !context.club) throw new Error("player_context_unavailable");
  const setup = await buildTacticalSetup(context.admin, context.user.id, context.club.id);
  return <div className="sports-app"><GameWorkspaceHeader clubName={context.club.name} userEmail={access.userEmail} /><main className="sports-page wide"><header className="section-heading"><div><p>Comissao tecnica</p><h1>Tatica e escalacao</h1></div><span>Selecione uma posicao e escolha o jogador</span></header><TacticsBoard setup={setup} /></main></div>;
}
