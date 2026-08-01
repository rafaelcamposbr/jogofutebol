import Link from "next/link";
import { BetaBadge } from "@/components/BetaBadge";

export function AccessBar({
  mode,
  userEmail,
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
        {mode === "authenticated" ? <Link href="/escritorio">Escritorio</Link> : null}
        {mode === "authenticated" ? <Link href="/imprensa">Imprensa</Link> : null}
        {mode === "authenticated" ? <Link href="/elenco">Elenco</Link> : null}
        {mode === "authenticated" ? <Link href="/mercado">Mercado</Link> : null}
        {mode === "authenticated" ? <Link href="/calendario">Calendario</Link> : null}
        {mode === "authenticated" ? <Link href="/minha-conta">Minha Conta</Link> : null}
        {mode === "authenticated" ? <Link href="/minha-conta#ajuda">Ajuda</Link> : null}
        <Link href="/status">Status</Link>
        {mode === "authenticated" ? (
          <form className="logout-form" action="/logout" method="post">
            <button type="submit">Sair</button>
          </form>
        ) : <Link href="/login">Entrar</Link>}
      </div>
    </div>
  );
}
