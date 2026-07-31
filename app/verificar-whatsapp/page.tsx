import { VerificationPanel } from "@/components/VerificationPanel";
import { getAuthenticatedProfile } from "@/lib/auth/profile";
import { maskWhatsapp, safeNextPath } from "@/lib/auth/validation";

export default async function VerifyWhatsappPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const query = await searchParams;
  const nextPath = safeNextPath(query.next, "/escritorio");
  const { profile } = await getAuthenticatedProfile("/verificar-whatsapp");

  return (
    <main className="plain-page verification-page">
      <VerificationPanel
        channel="whatsapp"
        destination={maskWhatsapp(profile.whatsapp_normalized)}
        nextPath={nextPath}
        verified={profile.whatsapp_game_verified}
      />
    </main>
  );
}
