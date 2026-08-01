import { GameWorkspace } from "@/components/GameWorkspace";
import { StaffIntelligenceHub } from "@/components/StaffIntelligenceHub";
import { getGameAccess } from "@/lib/game/access";

export const dynamic = "force-dynamic";

export default async function StaffIntelligencePage() {
  const access = await getGameAccess({ nextPath: "/escritorio/inteligencia" });
  const clubId = access.initialState.club.supabaseClubId;
  return (
    <GameWorkspace access={access} title="Central de Pessoas">
      <main className="people-page">
        <StaffIntelligenceHub clubId={clubId} />
      </main>
    </GameWorkspace>
  );
}
