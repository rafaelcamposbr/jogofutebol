import { APP_ENV, APP_VERSION } from "@/lib/env";

export function BetaBadge() {
  const label = APP_ENV.toLowerCase() === "beta" ? "Servidor Beta" : `Servidor ${APP_ENV}`;

  return (
    <span className="beta-badge" title={`${label} - Versao ${APP_VERSION}`}>
      <strong>{label}</strong>
      <span>Versao {APP_VERSION}</span>
    </span>
  );
}
