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
      <section className="auth-card">
        <h2>Acessar beta</h2>
        <p>Entre com uma conta de teste ou navegue como visitante com dados temporarios.</p>
        <div className="link-row">
          <Link href="/login">Entrar</Link>
          <Link href="/cadastro">Criar conta</Link>
          <Link href="/experimentar">Experimentar o jogo</Link>
          <Link href="/status">Status</Link>
        </div>
      </section>
    </main>
  );
}
