import Link from "next/link";
import type { ReactNode } from "react";

type Breadcrumb = { label: string; href?: string };

export function AppPageHeader({
  title,
  subtitle,
  backHref = "/escritorio",
  backLabel = "Voltar",
  breadcrumbs = [],
  actions,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: ReactNode;
}) {
  return (
    <header className="app-page-header">
      <nav className="app-breadcrumbs" aria-label="Navegacao estrutural">
        <Link href={backHref}>{backLabel}</Link>
        {breadcrumbs.map((item, index) => (
          <span key={`${item.label}-${index}`}>
            <i aria-hidden="true">/</i>
            {item.href ? <Link href={item.href}>{item.label}</Link> : <b aria-current="page">{item.label}</b>}
          </span>
        ))}
      </nav>
      <div className="app-page-title-row">
        <div><h1>{title}</h1>{subtitle ? <p>{subtitle}</p> : null}</div>
        <div className="app-page-actions">{actions}<Link className="office-link" href="/escritorio">Ir para o Escritorio</Link></div>
      </div>
    </header>
  );
}
