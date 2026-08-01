import Link from "next/link";
import { BetaBadge } from "@/components/BetaBadge";
import { safeNextPath } from "@/lib/auth/validation";

const errorCopy: Record<string, { title: string; text: string }> = {
  "auth-unavailable": { title: "Autenticacao indisponivel", text: "O servico de autenticacao nao respondeu. Sua sessao nao foi encerrada." },
  "session-unavailable": { title: "Nao foi possivel validar a sessao", text: "Houve uma falha temporaria ao consultar sua sessao. Tente novamente." },
  "profile-missing": { title: "Perfil incompleto", text: "A conta esta autenticada, mas o perfil do jogo nao foi encontrado. Nenhum logout foi executado." },
  "profile-unavailable": { title: "Perfil temporariamente indisponivel", text: "Nao foi possivel consultar seu perfil agora. Sua sessao foi preservada." },
  "club-unavailable": { title: "Clube temporariamente indisponivel", text: "Nao foi possivel consultar o clube agora. Sua sessao foi preservada." },
};

export default async function ErrorPage({ searchParams }: { searchParams: Promise<{ reason?: string; next?: string }> }) {
  const query = await searchParams;
  const copy = errorCopy[query.reason || ""] || { title: "Algo saiu do esperado", text: "Nao exibimos detalhes tecnicos em producao. Tente novamente." };
  const retryPath = safeNextPath(query.next, "/");
  return (
    <main className="plain-page">
      <section className="plain-card">
        <BetaBadge />
        <h1>{copy.title}</h1>
        <p>{copy.text}</p>
        <div className="link-row">
          <Link href={retryPath}>Tentar novamente</Link>
          <Link href="/minha-conta">Minha Conta</Link>
          <Link href="/status">Ver status</Link>
        </div>
      </section>
    </main>
  );
}
