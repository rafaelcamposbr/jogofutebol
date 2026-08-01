import Link from "next/link";
import { BetaBadge } from "@/components/BetaBadge";
import { getOptionalAuthenticatedHome } from "@/lib/auth/home";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const destination = await getOptionalAuthenticatedHome("/");
  if (destination) redirect(destination);

  return (
    <main className="auth-page">
      <section className="auth-hero">
        <BetaBadge />
        <h1>Gestão de Futebol</h1>
        <p>
          Assuma a direção, estruture o clube e acompanhe um universo persistente.
        </p>
      </section>
      <section className="home-entry" aria-label="Escolha como acessar">
        <div className="home-choice-grid">
          <Link className="home-choice" href="/login">
            <span>Entrar</span>
            <small>Acessar uma conta existente</small>
          </Link>
          <Link className="home-choice" href="/cadastro">
            <span>Criar conta</span>
            <small>Criar uma nova conta</small>
          </Link>
        </div>
        <div className="link-row home-secondary">
          <Link href="/experimentar">Experimentar como visitante</Link>
          <Link href="/status">Status</Link>
        </div>
      </section>
    </main>
  );
}
