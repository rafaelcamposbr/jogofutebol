import Link from "next/link";
import { BetaBadge } from "@/components/BetaBadge";

export function AccessBar({
  mode,
  userEmail,
  verification,
}: {
  mode: "authenticated" | "guest" | "public";
  userEmail?: string;
  verification: { email: boolean; whatsapp: boolean };
}) {
  return (
    <div className="access-bar">
      <BetaBadge />
      <div className="access-actions">
        {mode === "guest" ? <span className="access-note">Modo visitante: dados temporarios.</span> : null}
        {mode === "authenticated" && userEmail ? <span className="access-note">{userEmail}</span> : null}
        {mode === "authenticated" && !verification.email ? <Link href="/verificar-email">E-mail pendente</Link> : null}
        {mode === "authenticated" && !verification.whatsapp ? <Link href="/verificar-whatsapp">WhatsApp pendente</Link> : null}
        {mode === "authenticated" ? <Link href="/minha-conta">Minha Conta</Link> : null}
        <Link href="/status">Status</Link>
        {mode === "authenticated" ? <Link href="/logout">Sair</Link> : <Link href="/login">Entrar</Link>}
      </div>
    </div>
  );
}
