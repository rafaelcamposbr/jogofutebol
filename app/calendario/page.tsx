import Link from "next/link";
import { GameWorkspaceHeader } from "@/components/GameWorkspaceHeader";
import { QaMatchLab } from "@/components/QaMatchLab";
import { getGameAccess } from "@/lib/game/access";
import { getPlayerGameContext } from "@/lib/game/players/server";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const access = await getGameAccess({ nextPath: "/calendario" }); const context = await getPlayerGameContext();
  if (!context.ok || !context.club) throw new Error("player_context_unavailable");
  const { data: matches } = await context.admin.from("matches").select("id,match_type,competition,status,current_minute,opponent_name,home_score,away_score,scheduled_at").eq("club_id", context.club.id).order("created_at", { ascending: false }).limit(30);
  return <div className="sports-app"><GameWorkspaceHeader clubName={context.club.name} userEmail={access.userEmail} /><main className="sports-page"><header className="section-heading"><div><p>Agenda esportiva</p><h1>Calendario e partidas</h1></div></header><QaMatchLab /><section className="match-list"><h2>Partidas recentes</h2>{matches?.length ? matches.map((match) => <Link href={`/calendario/partidas/${match.id}`} key={match.id}><span>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(match.scheduled_at))}</span><strong>{context.club!.name} {match.home_score} x {match.away_score} {match.opponent_name}</strong><small>{match.status} - {match.current_minute}&apos; - {match.match_type.toUpperCase()}</small></Link>) : <p className="empty-state">Nenhuma partida criada.</p>}</section></main></div>;
}
