import { AccessBar } from "@/components/AccessBar";
import { StaffIntelligenceHub } from "@/components/StaffIntelligenceHub";
import { getGameAccess } from "@/lib/game/access";

export const dynamic = "force-dynamic";

export default async function StaffIntelligencePage() {
  const access = await getGameAccess({ requireVerification: "whatsapp", nextPath: "/escritorio/inteligencia" });
  const clubId = access.initialState.club.supabaseClubId;
  return (
    <>
      <AccessBar mode={access.mode} userEmail={access.userEmail} verification={access.verification} />
      <main className="people-page">
        <StaffIntelligenceHub clubId={clubId} />
      </main>
    </>
  );
}
