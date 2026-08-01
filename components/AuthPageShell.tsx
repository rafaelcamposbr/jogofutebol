import Link from "next/link";
import { BetaBadge } from "@/components/BetaBadge";

export function AuthPageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="auth-page">
      <section className="auth-hero">
        <BetaBadge />
        <h1>Gestão de clube do zero</h1>
        <p>
          Crie sua conta, funde um clube e continue de onde parou em qualquer dispositivo.
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
