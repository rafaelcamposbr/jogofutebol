import type { ReactNode } from "react";
import { GameAppShell } from "@/components/game-ui";
import type { getGameAccess } from "@/lib/game/access";

type GameAccess = Awaited<ReturnType<typeof getGameAccess>>;

export function GameWorkspace({ access, children, title }: { access: GameAccess; children: ReactNode; title?: string }) {
  const state = access.initialState;
  return (
    <GameAppShell
      clubName={state.club.fullName}
      clubAcronym={state.club.acronym}
      clubColor={state.club.colors.primary}
      balance={state.finance.cash}
      reputation={state.reputations.institutional.value}
      userEmail={access.userEmail}
      guest={access.mode !== "authenticated"}
      title={title}
    >
      {children}
    </GameAppShell>
  );
}
