import { notFound } from "next/navigation";
import { GameWorkspaceHeader } from "@/components/GameWorkspaceHeader";
import { MatchCenter } from "@/components/MatchCenter";
import { getGameAccess } from "@/lib/game/access";
import { getMatchView } from "@/lib/game/matches/server";
import { getPlayerGameContext } from "@/lib/game/players/server";

export const dynamic = "force-dynamic";

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const access = await getGameAccess({ nextPath: "/calendario" }); const context = await getPlayerGameContext();
  if (!context.ok || !context.club) throw new Error("player_context_unavailable");
  const { id } = await params; const view = await getMatchView(context.admin, context.user.id, id); if (!view) notFound();
  return <div className="sports-app"><GameWorkspaceHeader clubName={context.club.name} userEmail={access.userEmail} /><main className="sports-page wide"><MatchCenter initialView={view} /></main></div>;
}
