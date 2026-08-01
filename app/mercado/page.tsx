import Link from "next/link";
import { GameWorkspaceHeader } from "@/components/GameWorkspaceHeader";
import { getGameAccess } from "@/lib/game/access";
import { buildFreeAgentMarket, ensurePlayerWorld, getPlayerGameContext } from "@/lib/game/players/server";

export const dynamic = "force-dynamic";

export default async function MarketPage() {
  const access = await getGameAccess({ nextPath: "/mercado" }); const context = await getPlayerGameContext();
  if (!context.ok || !context.club) throw new Error("player_context_unavailable");
  await ensurePlayerWorld(context.admin, context.club.id); const players = await buildFreeAgentMarket(context.admin);
  return <div className="sports-app"><GameWorkspaceHeader clubName={context.club.name} userEmail={access.userEmail} /><main className="sports-page"><header className="section-heading"><div><p>Observacao e recrutamento</p><h1>Agentes livres</h1></div><span>{players.length} jogadores no mercado persistente</span></header><div className="sports-table-wrap"><table className="sports-table"><thead><tr><th>Jogador</th><th>Pos.</th><th>Idade</th><th>Nacionalidade</th><th>Pe</th><th>Avaliacao</th><th>Potencial percebido</th></tr></thead><tbody>{players.map((player) => <tr key={player.id}><td><strong>{player.known_as}</strong></td><td>{player.main_position}</td><td>{player.age}</td><td>{player.nationality}</td><td>{player.preferred_foot === "left" ? "Esquerdo" : "Direito"}</td><td>{Number(player.current_overall).toFixed(0)}</td><td>{player.public_potential_band}</td></tr>)}</tbody></table></div><p className="indicator-note"><Link href="/elenco">Voltar ao elenco</Link> - Talento natural e potencial exato permanecem ocultos.</p></main></div>;
}
