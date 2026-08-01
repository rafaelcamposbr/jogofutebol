import { TutorialCoach } from "@/components/TutorialCoach";
import { StaffSyncBridge } from "@/components/StaffSyncBridge";
import { LegacyRuntime } from "@/components/LegacyRuntime";
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
  const staffCatalog = {
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
  };

  return (
    <>
      {guest ? (
        <div className="guest-warning" role="status">
          Voce esta no modo visitante. Os dados desta sessao sao demonstrativos e nao serao gravados como progresso real.
        </div>
      ) : null}
      <div id="app" className="app-shell legacy-app-frame" suppressHydrationWarning />
      <div id="toast-region" className="toast-region" aria-live="polite" />
      <LegacyRuntime appEnv={APP_ENV} appVersion={APP_VERSION} guest={guest} verification={verification} staffCatalog={staffCatalog} state={state} />
      <StaffSyncBridge enabled={!guest} clubId={state.club?.supabaseClubId} />
      <TutorialCoach enabled={!guest} verification={verification} />
    </>
  );
}
