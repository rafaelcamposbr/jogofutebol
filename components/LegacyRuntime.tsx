"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

type LegacyWindow = Window & {
  __LEGACY_GAME_INIT__?: () => void;
  __LEGACY_GAME_CLEANUP__?: () => void;
  __APP_ENV__?: string;
  __APP_VERSION__?: string;
  __GUEST_MODE__?: boolean;
  __VERIFICATION_STATUS__?: { email: boolean; whatsapp: boolean };
  __STAFF_CATALOG__?: unknown;
};

export function LegacyRuntime({ appEnv, appVersion, guest, verification, staffCatalog, state }: {
  appEnv: string;
  appVersion: string;
  guest: boolean;
  verification: { email: boolean; whatsapp: boolean };
  staffCatalog: unknown;
  state: Record<string, unknown>;
}) {
  const pathname = usePathname();
  const started = useRef(false);

  function start() {
    const legacyWindow = window as LegacyWindow;
    if (started.current || !legacyWindow.__LEGACY_GAME_INIT__) return;
    legacyWindow.__APP_ENV__ = appEnv;
    legacyWindow.__APP_VERSION__ = appVersion;
    legacyWindow.__GUEST_MODE__ = guest;
    legacyWindow.__VERIFICATION_STATUS__ = verification;
    legacyWindow.__STAFF_CATALOG__ = staffCatalog;
    try {
      const key = "football-club-manager-prototype-v1";
      const current = window.localStorage.getItem(key);
      const parsed = current ? JSON.parse(current) : null;
      const nextClub = (state.club as { supabaseClubId?: string } | undefined)?.supabaseClubId;
      if (guest || !parsed?.club || parsed.club.supabaseClubId !== nextClub) {
        window.localStorage.setItem(key, JSON.stringify(state));
      }
    } catch (error) {
      console.warn("Falha ao preparar estado inicial", error);
    }
    legacyWindow.__LEGACY_GAME_INIT__();
    started.current = true;
  }

  useEffect(() => {
    started.current = false;
    start();
    return () => {
      (window as LegacyWindow).__LEGACY_GAME_CLEANUP__?.();
      started.current = false;
    };
    // The route is the lifecycle boundary for the legacy workspace.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return <Script src="/legacy/script.js" strategy="afterInteractive" onReady={start} />;
}
