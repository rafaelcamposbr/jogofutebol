import Link from "next/link";
import { BetaBadge } from "@/components/BetaBadge";

export default function HomePage() {
  return (
    <main className="auth-page">
      <section className="auth-hero">
        <BetaBadge />
        <h1>Simulador Online de Gestao de Clube</h1>
        <p>
          Primeira beta remota para testar criacao de clubes, navegacao do prototipo,
          imprensa, perfil publico e feedbacks.
        </p>
      </section>
      <section className="home-entry" aria-label="Escolha como acessar">
        <div className="home-choice-grid">
          <Link className="home-choice" href="/login">
            <span>LOGAR</span>
            <small>Acessar uma conta existente</small>
          </Link>
          <Link className="home-choice" href="/cadastro">
            <span>CADASTRAR</span>
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
