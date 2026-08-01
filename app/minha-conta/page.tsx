import { AccountManager } from "@/components/AccountManager";
import { BetaBadge } from "@/components/BetaBadge";
import { getAuthenticatedProfile } from "@/lib/auth/profile";
import { maskWhatsapp } from "@/lib/auth/validation";
import { TutorialHelp } from "@/components/TutorialHelp";
import { AccessBar } from "@/components/AccessBar";
import { AppPageHeader } from "@/components/AppPageHeader";
import { ClubBankruptcyManager } from "@/components/ClubBankruptcyManager";

export const dynamic = "force-dynamic";

export default async function MyAccountPage() {
  const { profile } = await getAuthenticatedProfile();

  return (
    <><AccessBar mode="authenticated" userEmail={profile.email} verification={{ email: profile.email_game_verified, whatsapp: profile.whatsapp_game_verified }} /><main className="plain-page account-page">
      <section className="plain-card">
        <BetaBadge />
        <AppPageHeader title="Minha Conta" subtitle="Dados de acesso e gestao do clube." backHref="/escritorio" />
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
        <div className="account-help-link" id="ajuda">
          <h2>Ajuda e Tutorial</h2>
          <p>Retome as etapas de implantacao e as orientacoes contextuais do clube.</p>
          <TutorialHelp />
        </div>
        <details className="account-editor club-management" id="gestao-clube">
          <summary>Gestao do clube</summary>
          <h2>Declarar falencia</h2>
          <ClubBankruptcyManager />
        </details>
      </section>
    </main></>
  );
}
