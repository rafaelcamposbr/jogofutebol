"use client";

import { usePathname } from "next/navigation";
import {
  Banknote,
  BookOpenCheck,
  Building2,
  FileText,
  GraduationCap,
  Handshake,
  Landmark,
  Megaphone,
  MessageSquareText,
  Newspaper,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import { MetricCard, ModuleCard } from "@/components/game-ui/GameCards";

export function GameRouteHub({ balance, reputation, eventCount }: { balance: number; reputation: number; eventCount: number }) {
  const pathname = usePathname();
  if (pathname === "/escritorio") {
    return (
      <section className="game-route-hub office" aria-labelledby="office-hub-title">
        <header className="game-hub-heading"><div><span>Visão do clube</span><h2 id="office-hub-title">Escritório</h2></div></header>
        <div className="game-hub-metrics">
          <MetricCard label="Caixa" value={new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(balance)} icon={<Banknote size={18} />} tone="accent" />
          <MetricCard label="Reputação" value={reputation.toFixed(1)} icon={<ShieldCheck size={18} />} tone="lime" />
          <MetricCard label="Registros recentes" value={eventCount} icon={<FileText size={18} />} tone="blue" />
        </div>
        <div className="game-module-grid">
          <ModuleCard href="/escritorio/inteligencia" title="Central de Pessoas" description="Orientações, reuniões e relações" icon={<MessageSquareText size={34} />} tone="accent" className="feature" />
          <ModuleCard href="/escritorio/funcionarios" title="Funcionários" description="Equipe, contratos e organograma" icon={<Users size={34} />} />
          <ModuleCard href="/escritorio/funcionarios/desenvolvimento" title="Cursos" description="Desenvolvimento profissional" icon={<GraduationCap size={34} />} tone="lime" />
          <ModuleCard href="/escritorio/instalacoes" title="Instalações" description="CT, estádio, terrenos e obras" icon={<Building2 size={34} />} tone="blue" />
          <ModuleCard href="/escritorio/instalacoes/salas" title="Salas" description="Operações administrativas" icon={<Landmark size={34} />} />
          <ModuleCard href="/escritorio/financas" title="Finanças" description="Caixa, despesas e patrimônio" icon={<Banknote size={34} />} />
        </div>
      </section>
    );
  }
  if (pathname === "/imprensa") {
    return (
      <section className="game-route-hub press" aria-labelledby="press-hub-title">
        <header className="game-hub-heading"><div><span>Notícias e reputação</span><h2 id="press-hub-title">Imprensa</h2></div></header>
        <div className="game-module-grid press-grid">
          <ModuleCard href="/imprensa/arquibancada" title="Arquibancada" description="Acontecimentos do universo" icon={<Megaphone size={36} />} tone="accent" className="feature" />
          <ModuleCard href="/imprensa/meu-clube" title="Meu Clube" description="Publicações internas" icon={<ShieldCheck size={34} />} />
          <ModuleCard href="/imprensa/mercado-da-bola" title="Mercado da Bola" description="Negociações e contratos" icon={<Handshake size={34} />} tone="lime" />
          <ModuleCard href="/imprensa/jornal-horizonte" title="Jornal Horizonte" description="Cidade, região e nacional" icon={<Newspaper size={34} />} tone="blue" />
          <ModuleCard href="/imprensa/comunicados" title="Comunicados" description="Notas institucionais" icon={<BookOpenCheck size={34} />} />
          <ModuleCard href="/imprensa/busca" title="Buscar Clubes" description="Nome, cidade, sigla ou hashtag" icon={<Search size={34} />} />
        </div>
      </section>
    );
  }
  return null;
}
