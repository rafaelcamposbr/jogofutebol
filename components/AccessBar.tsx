import Link from "next/link";
import { BetaBadge } from "@/components/BetaBadge";

export function AccessBar({ mode, userEmail }: { mode: "authenticated" | "guest" | "public"; userEmail?: string }) {
  return (
    <div className="access-bar">
      <BetaBadge />
      <div className="access-actions">
        {mode === "guest" ? <span className="access-note">Modo visitante: dados temporarios.</span> : null}
        {mode === "authenticated" && userEmail ? <span className="access-note">{userEmail}</span> : null}
        <Link href="/status">Status</Link>
        {mode === "authenticated" ? <Link href="/logout">Sair</Link> : <Link href="/login">Entrar</Link>}
      </div>
    </div>
  );
}
