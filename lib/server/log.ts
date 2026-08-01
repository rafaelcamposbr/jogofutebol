import "server-only";

type SafeLogDetails = Record<string, boolean | number | string | null | undefined>;

export function logServerEvent(
  area: "auth" | "navigation" | "profile" | "tutorial" | "verification",
  event: string,
  details: SafeLogDetails = {},
) {
  console.info(`[${area}] ${event}`, details);
}

export function logServerError(
  area: "auth" | "navigation" | "profile" | "tutorial" | "verification",
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
