import "server-only";

type SafeLogDetails = Record<string, boolean | number | string | null | undefined>;
type LogArea = "auth" | "navigation" | "profile" | "tutorial" | "verification" | "players" | "matches";

export function logServerEvent(
  area: LogArea,
  event: string,
  details: SafeLogDetails = {},
) {
  console.info(`[${area}] ${event}`, details);
}

export function logServerError(
  area: LogArea,
  event: string,
  error: unknown,
  details: SafeLogDetails = {},
) {
  const candidate = error && typeof error === "object"
    ? error as { code?: string; name?: string; status?: number }
    : null;
  console.error(`[${area}] ${event}`, {
    ...details,
    errorCode: candidate?.code || candidate?.name || "unknown",
    status: candidate?.status,
  });
}
