"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  ChevronRight,
  CircleUserRound,
  LogOut,
  Newspaper,
  Search,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

type GameAppShellProps = {
  children: ReactNode;
  clubName: string;
  clubAcronym?: string;
  clubColor?: string;
  balance?: number;
  reputation?: number;
  userEmail?: string;
  guest?: boolean;
  title?: string;
};

const navigation = [
  { href: "/escritorio", label: "Escritório", icon: BriefcaseBusiness },
  { href: "/elenco", label: "Elenco", icon: Users },
  { href: "/mercado", label: "Mercado", icon: Search },
  { href: "/imprensa", label: "Imprensa", icon: Newspaper },
  { href: "/calendario", label: "Calendário", icon: CalendarDays },
] as const;

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function getTitle(pathname: string) {
  if (pathname.startsWith("/minha-conta")) return "Minha Conta";
  return navigation.find((item) => isActive(pathname, item.href))?.label || "Gestão do Clube";
}

function formatBalance(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function ClubMark({ acronym, color }: { acronym: string; color: string }) {
  return (
    <span className="game-club-mark" style={{ "--club-color": color } as CSSProperties} aria-hidden="true">
      <Shield size={34} strokeWidth={1.6} />
      <b>{acronym.slice(0, 3)}</b>
    </span>
  );
}

export function GameAppShell({
  children,
  clubName,
  clubAcronym = "JF",
  clubColor = "#2ed6c5",
  balance,
  reputation,
  userEmail,
  guest = false,
  title,
}: GameAppShellProps) {
  const pathname = usePathname();
  const activeTitle = title || getTitle(pathname);

  return (
    <div className="game-app-shell">
      <aside className="game-sidebar" aria-label="Navegação principal">
        <Link className="game-brand" href="/escritorio" aria-label="Ir para o Escritório">
          <ClubMark acronym={clubAcronym} color={clubColor} />
          <span><strong>Projeto Futebol</strong><small>Gestão persistente</small></span>
        </Link>
        <div className="game-sidebar-club">
          <small>Clube atual</small>
          <strong>{clubName}</strong>
          {balance != null ? <span>{formatBalance(balance)}</span> : null}
        </div>
        <nav className="game-primary-nav">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            return (
              <Link href={item.href} key={item.href} className={active ? "active" : ""} aria-current={active ? "page" : undefined}>
                <Icon size={21} strokeWidth={1.8} aria-hidden="true" />
                <span>{item.label}</span>
                {active ? <ChevronRight size={16} aria-hidden="true" /> : null}
              </Link>
            );
          })}
        </nav>
        <div className="game-sidebar-footer">
          <Link href="/minha-conta"><CircleUserRound size={20} aria-hidden="true" /><span>Minha Conta</span></Link>
          <Link href="/escritorio/administracao"><Settings size={20} aria-hidden="true" /><span>Configurações</span></Link>
          {!guest ? (
            <form action="/logout" method="post">
              <button type="submit"><LogOut size={20} aria-hidden="true" /><span>Sair</span></button>
            </form>
          ) : null}
          {userEmail ? <small title={userEmail}>{userEmail}</small> : <small>Beta</small>}
        </div>
      </aside>

      <div className="game-stage">
        <header className="game-topbar">
          <Link className="game-mobile-mark" href="/escritorio" aria-label="Ir para o Escritório">
            <ClubMark acronym={clubAcronym} color={clubColor} />
          </Link>
          <div className="game-topbar-title">
            <span>{clubName}</span>
            <h1>{activeTitle}</h1>
          </div>
          <div className="game-topbar-actions">
            {balance != null ? <div><small>Caixa</small><strong>{formatBalance(balance)}</strong></div> : null}
            {reputation != null ? <div><small>Reputação</small><strong>{reputation.toFixed(1)}</strong></div> : null}
            <Link className="game-icon-button" href="/calendario/alertas" aria-label="Abrir alertas" title="Alertas">
              <Bell size={20} aria-hidden="true" />
            </Link>
            <Link className="game-icon-button desktop-only" href="/minha-conta" aria-label="Abrir Minha Conta" title="Minha Conta">
              <CircleUserRound size={21} aria-hidden="true" />
            </Link>
          </div>
        </header>
        <div className="game-mobile-stats" aria-label="Resumo do clube">
          {balance != null ? <span><small>Caixa</small><strong>{formatBalance(balance)}</strong></span> : null}
          {reputation != null ? <span><small>Reputação</small><strong>{reputation.toFixed(1)}</strong></span> : null}
          <span><small>Clube</small><strong>{clubAcronym}</strong></span>
        </div>
        <div className="game-shell-content">{children}</div>
      </div>

      <nav className="game-bottom-nav" aria-label="Navegação principal mobile">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          return (
            <Link href={item.href} key={item.href} className={active ? "active" : ""} aria-current={active ? "page" : undefined}>
              <Icon size={23} strokeWidth={active ? 2.2 : 1.7} aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
