import Link from "next/link";
import { BellRing, CalendarClock, CheckCircle2, ClipboardList, Timer } from "lucide-react";
import { GameWorkspace } from "@/components/GameWorkspace";
import { AppPageHeader } from "@/components/AppPageHeader";
import { ModuleCard } from "@/components/game-ui";
import { LegacyGame } from "@/components/LegacyGame";
import { QaMatchLab } from "@/components/QaMatchLab";
import { getGameAccess } from "@/lib/game/access";
import { getPlayerGameContext } from "@/lib/game/players/server";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const access = await getGameAccess({ nextPath: "/calendario" });
  if (access.mode !== "authenticated") return <GameWorkspace access={access}><LegacyGame initialState={access.initialState} guest verification={access.verification} /></GameWorkspace>;
  const context = await getPlayerGameContext();
  if (!context.ok || !context.club) throw new Error("player_context_unavailable");
  const { data: matches } = await context.admin.from("matches")
    .select("id,match_type,competition,status,opponent_name,home_score,away_score,scheduled_at,expected_end_at")
    .eq("club_id", context.club.id).order("created_at", { ascending: false }).limit(30);
  return <GameWorkspace access={access}><main className="sports-page"><AppPageHeader title="Calendario" subtitle="Partidas, compromissos e processos do clube." breadcrumbs={[{ label: "Calendario" }]} />
    <section className="calendar-module-grid" aria-label="Visoes do calendario">
      <ModuleCard href="/calendario/proximos" title="Proximos eventos" description="Prazos e compromissos" icon={<CalendarClock size={34} />} tone="accent" className="feature" />
      <ModuleCard href="/calendario/agenda" title="Agenda" description="Todos os eventos" icon={<ClipboardList size={32} />} />
      <ModuleCard href="/calendario/programacoes" title="Programacoes" description="Cursos, obras e atividades" icon={<Timer size={32} />} tone="lime" />
      <ModuleCard href="/calendario/concluidos" title="Concluidos" description="Historico processado" icon={<CheckCircle2 size={32} />} tone="blue" />
      <ModuleCard href="/calendario/alertas" title="Alertas" description="Itens que exigem atencao" icon={<BellRing size={32} />} />
    </section>
    <QaMatchLab />
    <section className="match-list game-data-section"><header><div><span>Historico esportivo</span><h2>Partidas recentes</h2></div><strong>{matches?.length || 0}</strong></header>{matches?.length ? matches.map((match) => {
      const finished = match.status === "finished";
      const expected = match.status === "in_progress" && match.expected_end_at ? ` · previsao ${new Intl.DateTimeFormat("pt-BR", { timeStyle: "short" }).format(new Date(match.expected_end_at))}` : "";
      return <Link href={`/calendario/partidas/${match.id}`} key={match.id}><span>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(match.scheduled_at))}</span><strong>{finished ? `${context.club!.name} ${match.home_score} x ${match.away_score} ${match.opponent_name}` : `${context.club!.name} x ${match.opponent_name}`}</strong><small>{matchStatus(match.status)} · {match.match_type.toUpperCase()}{expected}</small></Link>;
    }) : <p className="empty-state">Nenhuma partida criada.</p>}</section>
  </main></GameWorkspace>;
}

function matchStatus(value: string) {
  return ({ ready: "Pre-jogo", in_progress: "Em andamento", awaiting_processing: "Aguardando processamento", finished: "Concluida", postponed: "Adiada", cancelled: "Cancelada", failed: "Falha" } as Record<string, string>)[value] || value;
}
