import { notFound } from "next/navigation";
import { AppPageHeader } from "@/components/AppPageHeader";
import { GameWorkspaceHeader } from "@/components/GameWorkspaceHeader";
import { TryoutDetail } from "@/components/TryoutDetail";
import { getGameAccess } from "@/lib/game/access";
import { getScoutingContext, getTryoutDetail } from "@/lib/game/scouting/server";

export const dynamic = "force-dynamic";
export default async function TryoutDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const access = await getGameAccess({ nextPath: `/mercado/peneiras/${id}` });
  const context = await getScoutingContext();
  if (!context.ok || !context.club) return null;
  const tryout = await getTryoutDetail(context.admin, context.user.id, context.club.id, id);
  if (!tryout) notFound();
  return <div className="sports-app"><GameWorkspaceHeader clubName={access.initialState.club.fullName} userEmail={access.userEmail} /><main className="sports-page">
    <AppPageHeader title="Resultado da peneira" subtitle="Relatorios estimados, disponibilidade e contrato de teste." backHref="/mercado/peneiras" breadcrumbs={[{ label: "Mercado", href: "/mercado" }, { label: "Peneiras", href: "/mercado/peneiras" }, { label: "Resultado" }]} />
    <TryoutDetail initialTryout={tryout} />
  </main></div>;
}
