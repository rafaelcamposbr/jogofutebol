import { AppPageHeader } from "@/components/AppPageHeader";
import { GameWorkspaceHeader } from "@/components/GameWorkspaceHeader";
import { TryoutDashboard } from "@/components/TryoutDashboard";
import { getGameAccess } from "@/lib/game/access";
import { getScoutingContext, listScouts, listTryouts } from "@/lib/game/scouting/server";

export const dynamic = "force-dynamic";
export default async function TryoutsPage() {
  const access = await getGameAccess({ nextPath: "/mercado/peneiras" });
  const context = await getScoutingContext();
  if (!context.ok || !context.club) return null;
  const [tryouts, scouts] = await Promise.all([listTryouts(context.admin, context.user.id, context.club.id), listScouts(context.admin, context.club.id)]);
  return <div className="sports-app"><GameWorkspaceHeader clubName={access.initialState.club.fullName} userEmail={access.userEmail} /><main className="sports-page">
    <AppPageHeader title="Peneiras" subtitle="Planeje a observacao e avalie os candidatos encontrados." backHref="/mercado" breadcrumbs={[{ label: "Mercado", href: "/mercado" }, { label: "Peneiras" }]} />
    <TryoutDashboard initialTryouts={tryouts as never} scouts={scouts} />
  </main></div>;
}
