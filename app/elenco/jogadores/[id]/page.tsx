import { notFound } from "next/navigation";
import { GameWorkspaceHeader } from "@/components/GameWorkspaceHeader";
import { PlayerProfile } from "@/components/PlayerProfile";
import { getGameAccess } from "@/lib/game/access";
import { buildPlayerProfile, getPlayerGameContext } from "@/lib/game/players/server";

export const dynamic = "force-dynamic";

export default async function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const access = await getGameAccess({ nextPath: "/elenco" }); const context = await getPlayerGameContext();
  if (!context.ok || !context.club) throw new Error("player_context_unavailable");
  const { id } = await params; const profile = await buildPlayerProfile(context.admin, context.club.id, id); if (!profile) notFound();
  return <div className="sports-app"><GameWorkspaceHeader clubName={context.club.name} userEmail={access.userEmail} /><main className="sports-page player-page"><PlayerProfile profile={profile} /></main></div>;
}
