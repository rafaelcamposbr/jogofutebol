import { LegacyGame } from "@/components/LegacyGame";
import { GameWorkspace } from "@/components/GameWorkspace";
import { GameRouteHub } from "@/components/game-ui/GameRouteHub";
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
    <GameWorkspace access={access}>
      <GameRouteHub
        balance={access.initialState.finance.cash}
        reputation={access.initialState.reputations.institutional.value}
        eventCount={access.initialState.events.length}
      />
      <LegacyGame
        initialState={access.initialState}
        guest={access.mode !== "authenticated"}
        verification={betaVerification}
      />
    </GameWorkspace>
  );
}
