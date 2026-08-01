import Link from "next/link";
import { BetaBadge } from "@/components/BetaBadge";

export default function NotFound() {
  return (
    <main className="plain-page">
      <section className="plain-card">
        <BetaBadge />
        <h1>Pagina nao encontrada</h1>
        <p>A rota solicitada nao existe nesta beta.</p>
        <div className="link-row">
          <Link href="/">Voltar ao jogo</Link>
          <Link href="/status">Status</Link>
        </div>
      </section>
    </main>
  );
}
