import Link from "next/link";
import { AccessBar } from "@/components/AccessBar";

export function GameWorkspaceHeader({ clubName, userEmail }: { clubName: string; userEmail?: string }) {
  return (
    <>
      <AccessBar mode="authenticated" userEmail={userEmail} verification={{ email: true, whatsapp: true }} />
      <header className="game-workspace-header">
        <div>
          <Link className="game-club-name" href="/escritorio">{clubName}</Link>
          <span>Gestao esportiva</span>
        </div>
        <nav aria-label="Gestao esportiva">
          <Link href="/imprensa">Imprensa</Link>
          <Link href="/elenco">Elenco</Link>
          <Link href="/mercado">Mercado</Link>
          <Link href="/escritorio">Escritorio</Link>
          <Link href="/calendario">Calendario</Link>
        </nav>
      </header>
    </>
  );
}
