import { AccessBar } from "@/components/AccessBar";
import { LegacyGame } from "@/components/LegacyGame";
import { getGameAccess } from "@/lib/game/access";

export async function GameRoute({ allowPublic = false }: { allowPublic?: boolean }) {
  const access = await getGameAccess({ allowPublic });

  return (
    <>
      <AccessBar mode={access.mode} userEmail={access.userEmail} />
      <LegacyGame initialState={access.initialState} guest={access.mode !== "authenticated"} />
    </>
  );
}
