export type AuthenticatedHomeState = {
  hasClub: boolean;
  whatsappVerified: boolean;
};

export function authenticatedHomeDestination(state: AuthenticatedHomeState) {
  if (!state.hasClub) return "/criar-clube";
  return state.whatsappVerified ? "/escritorio" : "/mercado";
}

export function isMissingSessionError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { name?: string; code?: string; message?: string; status?: number };
  const description = `${candidate.name || ""} ${candidate.code || ""} ${candidate.message || ""}`;
  return (
    candidate.name === "AuthSessionMissingError" ||
    candidate.code === "session_not_found" ||
    /auth session missing|session not found|invalid refresh token/i.test(description)
  );
}
