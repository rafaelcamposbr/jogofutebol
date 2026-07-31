"use client";

import { useEffect } from "react";

const STORAGE_KEY = "football-club-manager-prototype-v1";

export function StaffSyncBridge({ enabled, clubId }: { enabled: boolean; clubId?: string }) {
  useEffect(() => {
    if (!enabled || !clubId) return;
    let lastSignature = "";
    let stopped = false;
    async function sync() {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        const state = raw ? JSON.parse(raw) : null;
        if (state?.club?.supabaseClubId !== clubId || !Array.isArray(state?.staff?.employees)) return;
        const signature = JSON.stringify(state.staff.employees.map((employee: Record<string, unknown>) => [
          employee.id, employee.status, employee.roleId, employee.salary, employee.contractEndAt,
        ]));
        if (!signature || signature === lastSignature) return;
        const response = await fetch("/api/staff/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ employees: state.staff.employees }),
        });
        if (response.ok && !stopped) lastSignature = signature;
      } catch { /* Legacy state remains available locally if synchronization is offline. */ }
    }
    const timer = window.setInterval(() => void sync(), 15_000);
    const onFocus = () => void sync();
    window.addEventListener("focus", onFocus);
    void sync();
    return () => { stopped = true; window.clearInterval(timer); window.removeEventListener("focus", onFocus); };
  }, [clubId, enabled]);
  return null;
}
