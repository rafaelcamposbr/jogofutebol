import { AccountManager } from "@/components/AccountManager";
import { BetaBadge } from "@/components/BetaBadge";
import { getAuthenticatedProfile } from "@/lib/auth/profile";
import { maskWhatsapp } from "@/lib/auth/validation";

export const dynamic = "force-dynamic";

export default async function MyAccountPage() {
  const { profile } = await getAuthenticatedProfile();

  return (
    <main className="plain-page account-page">
      <section className="plain-card">
        <BetaBadge />
        <h1>Minha Conta</h1>
        <dl className="account-grid">
          <div><dt>Nome de usuario</dt><dd>{profile.username}</dd></div>
          <div><dt>Nome</dt><dd>{profile.first_name}</dd></div>
          <div><dt>Sobrenome</dt><dd>{profile.last_name}</dd></div>
          <div><dt>E-mail</dt><dd>{profile.email}</dd></div>
          <div><dt>Status do e-mail</dt><dd>{profile.email_game_verified ? "Confirmado" : "Pendente"}</dd></div>
          <div><dt>WhatsApp</dt><dd>{maskWhatsapp(profile.whatsapp_normalized)}</dd></div>
          <div><dt>Status do WhatsApp</dt><dd>{profile.whatsapp_game_verified ? "Confirmado" : "Pendente"}</dd></div>
          <div><dt>Conta criada</dt><dd>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(new Date(profile.created_at))}</dd></div>
        </dl>
        <AccountManager
          emailVerified={profile.email_game_verified}
          whatsappVerified={profile.whatsapp_game_verified}
        />
      </section>
    </main>
  );
}
