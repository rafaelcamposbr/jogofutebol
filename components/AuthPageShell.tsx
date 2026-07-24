import Link from "next/link";
import { BetaBadge } from "@/components/BetaBadge";

export function AuthPageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="auth-page">
      <section className="auth-hero">
        <BetaBadge />
        <h1>Gestao de clube do zero</h1>
        <p>
          Beta compartilhavel do simulador. Entre com e-mail e senha para salvar um clube no Supabase,
          ou use o modo visitante para navegar com dados demonstrativos.
        </p>
        <div className="auth-actions">
          <Link href="/status">Ver status</Link>
          <Link href="/experimentar">Experimentar o jogo</Link>
        </div>
      </section>
      {children}
    </main>
  );
}
