import { notFound } from "next/navigation";
import { GameWorkspace } from "@/components/GameWorkspace";
import { PlayerProfile } from "@/components/PlayerProfile";
import { AppPageHeader } from "@/components/AppPageHeader";
import { getGameAccess } from "@/lib/game/access";
import { buildPlayerProfile, getPlayerGameContext } from "@/lib/game/players/server";

export const dynamic = "force-dynamic";

export default async function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const access = await getGameAccess({ nextPath: "/elenco" }); const context = await getPlayerGameContext();
  if (!context.ok || !context.club) throw new Error("player_context_unavailable");
  const { id } = await params; const profile = await buildPlayerProfile(context.admin, context.club.id, id); if (!profile) notFound();
  return <GameWorkspace access={access}><main className="sports-page player-page"><AppPageHeader title="Perfil do jogador" subtitle="Observações, condição, histórico e relatórios da comissão." backHref="/elenco" breadcrumbs={[{ label: "Elenco", href: "/elenco" }, { label: profile.player.known_as }]} /><PlayerProfile profile={profile} /></main></GameWorkspace>;
}
