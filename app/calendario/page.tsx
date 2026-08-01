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
  const { data: matches } = await context.admin.from("matches").select("id,match_type,competition,status,current_minute,opponent_name,home_score,away_score,scheduled_at").eq("club_id", context.club.id).order("created_at", { ascending: false }).limit(30);
  return <GameWorkspace access={access}><main className="sports-page"><AppPageHeader title="Calendário" subtitle="Partidas, compromissos e processos do clube." breadcrumbs={[{ label: "Calendário" }]} />
    <section className="calendar-module-grid" aria-label="Visões do calendário">
      <ModuleCard href="/calendario/proximos" title="Próximos eventos" description="Prazos e compromissos" icon={<CalendarClock size={34} />} tone="accent" className="feature" />
      <ModuleCard href="/calendario/agenda" title="Agenda" description="Todos os eventos" icon={<ClipboardList size={32} />} />
      <ModuleCard href="/calendario/programacoes" title="Programações" description="Cursos, obras e atividades" icon={<Timer size={32} />} tone="lime" />
      <ModuleCard href="/calendario/concluidos" title="Concluídos" description="Histórico processado" icon={<CheckCircle2 size={32} />} tone="blue" />
      <ModuleCard href="/calendario/alertas" title="Alertas" description="Itens que exigem atenção" icon={<BellRing size={32} />} />
    </section>
    <QaMatchLab />
    <section className="match-list game-data-section"><header><div><span>Histórico esportivo</span><h2>Partidas recentes</h2></div><strong>{matches?.length || 0}</strong></header>{matches?.length ? matches.map((match) => <Link href={`/calendario/partidas/${match.id}`} key={match.id}><span>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(match.scheduled_at))}</span><strong>{context.club!.name} {match.home_score} x {match.away_score} {match.opponent_name}</strong><small>{match.status} - {match.current_minute}&apos; - {match.match_type.toUpperCase()}</small></Link>) : <p className="empty-state">Nenhuma partida criada.</p>}</section></main></GameWorkspace>;
}
