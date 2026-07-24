import Link from "next/link";
import { BetaBadge } from "@/components/BetaBadge";

export default function ErrorPage() {
  return (
    <main className="plain-page">
      <section className="plain-card">
        <BetaBadge />
        <h1>Algo saiu do esperado</h1>
        <p>Nao exibimos detalhes tecnicos em producao. Tente novamente ou reporte o problema pela beta.</p>
        <div className="link-row">
          <Link href="/central">Voltar para Central</Link>
          <Link href="/status">Ver status</Link>
        </div>
      </section>
    </main>
  );
}
