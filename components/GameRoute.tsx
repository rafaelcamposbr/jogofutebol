import { AccessBar } from "@/components/AccessBar";
import { LegacyGame } from "@/components/LegacyGame";
import { getGameAccess } from "@/lib/game/access";

export async function GameRoute({
  allowPublic = false,
  requireVerification,
  nextPath,
}: {
  allowPublic?: boolean;
  requireVerification?: "email" | "whatsapp";
  nextPath?: string;
}) {
  const access = await getGameAccess({ allowPublic, requireVerification, nextPath });

  return (
    <>
      <AccessBar mode={access.mode} userEmail={access.userEmail} verification={access.verification} />
      <LegacyGame
        initialState={access.initialState}
        guest={access.mode !== "authenticated"}
        verification={access.verification}
      />
    </>
  );
}
