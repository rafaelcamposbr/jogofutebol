import Script from "next/script";
import { TutorialCoach } from "@/components/TutorialCoach";
import { StaffSyncBridge } from "@/components/StaffSyncBridge";
import { APP_ENV, APP_VERSION } from "@/lib/env";
import { buildGuestLegacyState, buildLegacyState } from "@/lib/game/legacy-state";
import { STAFF_GROUPS, STAFF_ROLES, suggestedStaffSalary } from "@/lib/game/staff-catalog";

type LegacyGameProps = {
  initialState?: ReturnType<typeof buildLegacyState>;
  guest?: boolean;
  verification?: { email: boolean; whatsapp: boolean };
};

export function LegacyGame({ initialState, guest = false, verification = { email: true, whatsapp: true } }: LegacyGameProps) {
  const state = initialState || buildGuestLegacyState();
  const bootstrap = `
    window.__APP_ENV__ = ${JSON.stringify(APP_ENV)};
    window.__APP_VERSION__ = ${JSON.stringify(APP_VERSION)};
    window.__GUEST_MODE__ = ${JSON.stringify(guest)};
    window.__VERIFICATION_STATUS__ = ${JSON.stringify(verification)};
    window.__STAFF_CATALOG__ = ${JSON.stringify({
      groups: STAFF_GROUPS,
      roles: STAFF_ROLES.map((item) => ({
        id: item.id,
        label: item.label,
        group: item.groupId,
        subgroup: item.subgroup,
        baseSalary: suggestedStaffSalary(item, 50),
        salaryMin: item.salaryMin,
        salaryMax: item.salaryMax,
        relevance: item.relevance,
        officeRequired: item.officeRequired,
        required: item.required,
        area: item.area,
        reportsTo: item.reportsTo || null,
      })),
    })};
    (function(){
      try {
        var key = "football-club-manager-prototype-v1";
        var nextState = ${JSON.stringify(state)};
        var current = window.localStorage.getItem(key);
        if (${JSON.stringify(guest)} || !current) {
          window.localStorage.setItem(key, JSON.stringify(nextState));
          return;
        }
        var parsed = JSON.parse(current);
        if (!parsed.club || parsed.club.supabaseClubId !== nextState.club.supabaseClubId) {
          window.localStorage.setItem(key, JSON.stringify(nextState));
        }
      } catch (error) {
        console.warn("Falha ao preparar estado inicial", error);
      }
    })();
  `;

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: bootstrap }} />
      {guest ? (
        <div className="guest-warning" role="status">
          Voce esta no modo visitante. Os dados desta sessao sao demonstrativos e nao serao gravados como progresso real.
        </div>
      ) : null}
      <div id="app" className="app-shell" suppressHydrationWarning />
      <div id="toast-region" className="toast-region" aria-live="polite" />
      <Script src="/legacy/script.js" strategy="afterInteractive" />
      <StaffSyncBridge enabled={!guest} clubId={state.club?.supabaseClubId} />
      <TutorialCoach enabled={!guest} verification={verification} />
    </>
  );
}
