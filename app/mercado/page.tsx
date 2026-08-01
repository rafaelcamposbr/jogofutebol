import Link from "next/link";
import { BriefcaseBusiness, Building2, FileClock, Search, Telescope, TestTubeDiagonal } from "lucide-react";
import { GameWorkspace } from "@/components/GameWorkspace";
import { getGameAccess } from "@/lib/game/access";
import { buildFreeAgentMarket, ensurePlayerWorld, getPlayerGameContext } from "@/lib/game/players/server";
import { AppPageHeader } from "@/components/AppPageHeader";
import { ModuleCard } from "@/components/game-ui";
import { LegacyGame } from "@/components/LegacyGame";

export const dynamic = "force-dynamic";

export default async function MarketPage() {
  const access = await getGameAccess({ nextPath: "/mercado" });
  if (access.mode !== "authenticated") return <GameWorkspace access={access}><LegacyGame initialState={access.initialState} guest verification={access.verification} /></GameWorkspace>;
  const context = await getPlayerGameContext();
  if (!context.ok || !context.club) throw new Error("player_context_unavailable");
  await ensurePlayerWorld(context.admin, context.club.id); const players = await buildFreeAgentMarket(context.admin);
  return <GameWorkspace access={access}><main className="sports-page"><AppPageHeader title="Mercado" subtitle="Observação e recrutamento no mercado persistente." breadcrumbs={[{ label: "Mercado" }]} actions={<Link className="primary-link" href="/mercado/peneiras">Peneiras</Link>} />
    <section className="market-module-grid" aria-label="Áreas do mercado">
      <ModuleCard href="/mercado/jogadores" title="Buscar jogadores" description="Agentes livres e oportunidades" icon={<Search size={38} />} tone="accent" className="feature" />
      <ModuleCard href="/escritorio/funcionarios/busca" title="Buscar funcionários" description="Grupos e funções" icon={<BriefcaseBusiness size={34} />} tone="blue" />
      <ModuleCard href="/mercado/peneiras" title="Peneiras" description="Processos e candidatos" icon={<TestTubeDiagonal size={34} />} tone="lime" />
      <ModuleCard href="/mercado/observacao" title="Observação" description="Olheiros e relatórios" icon={<Telescope size={34} />} />
      <ModuleCard href="/mercado/historico" title="Negociações" description="Histórico de propostas" icon={<FileClock size={34} />} />
      <ModuleCard href="/mercado/imoveis" title="Imóveis" description="Salas e terrenos" icon={<Building2 size={34} />} />
    </section>
    <section className="game-data-section"><header><div><span>Disponíveis agora</span><h2>Agentes livres</h2></div><strong>{players.length}</strong></header><div className="sports-table-wrap"><table className="sports-table"><thead><tr><th>Jogador</th><th>Pos.</th><th>Idade</th><th>Nacionalidade</th><th>Pé</th><th>Leitura do clube</th></tr></thead><tbody>{players.map((player) => <tr key={player.id}><td data-label="Jogador"><strong>{player.known_as}</strong></td><td data-label="Posição">{player.main_position}</td><td data-label="Idade">{player.age}</td><td data-label="Nacionalidade">{player.nationality}</td><td data-label="Pé">{player.preferred_foot === "left" ? "Esquerdo" : "Direito"}</td><td data-label="Leitura">{player.observed_level}</td></tr>)}</tbody></table></div><p className="indicator-note"><Link href="/elenco">Voltar ao elenco</Link> - Atributos e potencial reais permanecem restritos ao motor.</p></section></main></GameWorkspace>;
}
