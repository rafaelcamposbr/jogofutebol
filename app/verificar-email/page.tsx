import { VerificationPanel } from "@/components/VerificationPanel";
import { getAuthenticatedProfile } from "@/lib/auth/profile";
import { maskEmail, safeNextPath } from "@/lib/auth/validation";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; next?: string }>;
}) {
  const query = await searchParams;
  const nextPath = safeNextPath(query.next, "/imprensa");
  const { profile } = await getAuthenticatedProfile(
    `/verificar-email${query.token ? `?token=${encodeURIComponent(query.token)}` : ""}`,
  );

  return (
    <main className="plain-page verification-page">
      <VerificationPanel
        channel="email"
        destination={maskEmail(profile.email)}
        nextPath={nextPath}
        token={query.token}
        verified={profile.email_game_verified}
      />
    </main>
  );
}
