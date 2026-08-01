import { AccessBar } from "@/components/AccessBar";
import { LegacyGame } from "@/components/LegacyGame";
import { getGameAccess } from "@/lib/game/access";

export async function GameRoute({
  allowPublic = false,
  nextPath,
}: {
  allowPublic?: boolean;
  nextPath?: string;
}) {
  const access = await getGameAccess({ allowPublic, nextPath });
  const betaVerification = { email: true, whatsapp: true };

  return (
    <>
      <AccessBar mode={access.mode} userEmail={access.userEmail} verification={access.verification} />
      <LegacyGame
        initialState={access.initialState}
        guest={access.mode !== "authenticated"}
        verification={betaVerification}
      />
    </>
  );
}
