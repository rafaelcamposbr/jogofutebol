import Link from "next/link";
import { GameWorkspaceHeader } from "@/components/GameWorkspaceHeader";
import { getGameAccess } from "@/lib/game/access";
import { buildFreeAgentMarket, ensurePlayerWorld, getPlayerGameContext } from "@/lib/game/players/server";
import { AppPageHeader } from "@/components/AppPageHeader";

export const dynamic = "force-dynamic";

export default async function MarketPage() {
  const access = await getGameAccess({ nextPath: "/mercado" }); const context = await getPlayerGameContext();
  if (!context.ok || !context.club) throw new Error("player_context_unavailable");
  await ensurePlayerWorld(context.admin, context.club.id); const players = await buildFreeAgentMarket(context.admin);
  return <div className="sports-app"><GameWorkspaceHeader clubName={context.club.name} userEmail={access.userEmail} /><main className="sports-page"><AppPageHeader title="Agentes livres" subtitle="Observacao e recrutamento no mercado persistente." breadcrumbs={[{ label: "Mercado" }]} actions={<Link className="primary-link" href="/mercado/peneiras">Peneiras</Link>} /><div className="sports-table-wrap"><table className="sports-table"><thead><tr><th>Jogador</th><th>Pos.</th><th>Idade</th><th>Nacionalidade</th><th>Pe</th><th>Leitura do clube</th></tr></thead><tbody>{players.map((player) => <tr key={player.id}><td><strong>{player.known_as}</strong></td><td>{player.main_position}</td><td>{player.age}</td><td>{player.nationality}</td><td>{player.preferred_foot === "left" ? "Esquerdo" : "Direito"}</td><td>{player.observed_level}</td></tr>)}</tbody></table></div><p className="indicator-note"><Link href="/elenco">Voltar ao elenco</Link> - Atributos e potencial reais permanecem restritos ao motor.</p></main></div>;
}
