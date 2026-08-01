import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

export function ModuleCard({ href, title, description, icon, value, tone = "default", className = "" }: {
  href: string; title: string; description?: string; icon: ReactNode; value?: ReactNode;
  tone?: "default" | "accent" | "lime" | "blue" | "danger"; className?: string;
}) {
  return (
    <Link href={href} className={`game-module-card tone-${tone} ${className}`}>
      <span className="game-module-icon" aria-hidden="true">{icon}</span>
      <span className="game-module-copy"><strong>{title}</strong>{description ? <small>{description}</small> : null}</span>
      {value != null ? <b className="game-module-value">{value}</b> : null}
      <ArrowRight className="game-module-arrow" size={19} aria-hidden="true" />
    </Link>
  );
}

export function MetricCard({ label, value, detail, icon, tone = "default" }: {
  label: string; value: ReactNode; detail?: ReactNode; icon?: ReactNode;
  tone?: "default" | "accent" | "lime" | "blue" | "danger";
}) {
  return (
    <article className={`game-metric-card tone-${tone}`}>
      <header>{icon ? <span aria-hidden="true">{icon}</span> : null}<small>{label}</small></header>
      <strong>{value}</strong>
      {detail ? <footer>{detail}</footer> : null}
    </article>
  );
}

export function GameEmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return <div className="game-empty-state"><strong>{title}</strong>{description ? <p>{description}</p> : null}{action}</div>;
}

export function StatusBadge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "success" | "warning" | "danger" | "info" }) {
  return <span className={`game-status-badge status-${tone}`}>{children}</span>;
}
