import { AppPageHeader } from "@/components/AppPageHeader";
import { GameWorkspace } from "@/components/GameWorkspace";
import { RoomOperations } from "@/components/RoomOperations";
import { getApiAuthContext } from "@/lib/auth/api";
import { getGameAccess } from "@/lib/game/access";
import { ROOM_OPTIONS } from "@/lib/game/rooms";

export const dynamic = "force-dynamic";

export default async function RoomsPage() {
  const access = await getGameAccess({ nextPath: "/escritorio/instalacoes/salas" });
  const context = await getApiAuthContext();
  if (context.error) return null;

  await context.admin.rpc("process_due_room_operations", {
    p_user_id: context.user.id,
    p_now: new Date().toISOString(),
  });
  const { data } = await context.admin
    .from("room_operations")
    .select("id,operation_type,room_type,cost_cents,status,started_at,completes_at,completed_at")
    .eq("owner_id", context.user.id)
    .order("created_at", { ascending: false });

  return (
    <GameWorkspace access={access}>
      <main className="sports-page">
        <AppPageHeader
          title="Salas"
          subtitle="Compra e aluguel com conclusão persistente pelo relógio do servidor."
          backHref="/escritorio/instalacoes"
          breadcrumbs={[{ label: "Instalações", href: "/escritorio/instalacoes" }, { label: "Salas" }]}
        />
        <RoomOperations options={ROOM_OPTIONS} initialOperations={data || []} />
      </main>
    </GameWorkspace>
  );
}
