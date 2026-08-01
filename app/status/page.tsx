import Link from "next/link";
import { BetaBadge } from "@/components/BetaBadge";
import { getStatusData } from "@/lib/status";

function labelSupabase(status: string) {
  if (status === "configured") return "Configurado";
  if (status === "unavailable") return "Indisponivel";
  return "Nao configurado";
}

export default async function StatusPage() {
  const status = await getStatusData();

  return (
    <main className="status-page">
      <section className="status-card">
        <BetaBadge />
        <h1>Status da Beta</h1>
        <p>Informacoes publicas do ambiente de testes, sem expor segredos.</p>
        <div className="status-grid">
          <div className="status-item"><span>Ambiente</span><strong>{status.environment}</strong></div>
          <div className="status-item"><span>Versao</span><strong>{status.version}</strong></div>
          <div className="status-item"><span>Aplicacao</span><strong>{status.appStatus}</strong></div>
          <div className="status-item"><span>Supabase</span><strong>{labelSupabase(status.supabaseStatus)}</strong></div>
          <div className="status-item"><span>Horario atual</span><strong>{new Date(status.currentTime).toLocaleString("pt-BR")}</strong></div>
          <div className="status-item"><span>Ultimo deploy</span><strong>{status.lastDeploy}</strong></div>
          <div className="status-item"><span>Manutencao</span><strong>{status.maintenanceMessage}</strong></div>
          <div className="status-item"><span>Modo demonstrativo</span><strong>{status.demoFeatures} funcoes</strong></div>
        </div>
        <div className="link-row" style={{ marginTop: 16 }}>
          <Link href="/">Voltar ao jogo</Link>
          <Link href="/login">Entrar</Link>
          <Link href="/experimentar">Experimentar</Link>
        </div>
      </section>
    </main>
  );
}
