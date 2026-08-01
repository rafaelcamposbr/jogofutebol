const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatBRL(value: number | string | null | undefined) {
  const amount = typeof value === "string" ? Number(value) : Number(value || 0);
  return BRL.format(Number.isFinite(amount) ? amount : 0);
}

export function formatBRLCents(cents: number | string | null | undefined) {
  const amount = Number(cents || 0);
  return formatBRL((Number.isFinite(amount) ? amount : 0) / 100);
}

export function moneyToCents(value: number | string) {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("invalid_money");
    return Math.round(value * 100);
  }
  const raw = value.trim().replace(/\s/g, "").replace(/^R\$/i, "");
  if (!raw) return 0;
  const normalized = raw.includes(",")
    ? raw.replace(/\./g, "").replace(",", ".")
    : raw;
  if (!/^-?\d+(?:\.\d{1,2})?$/.test(normalized)) throw new Error("invalid_money");
  const amount = Number(normalized);
  if (!Number.isFinite(amount)) throw new Error("invalid_money");
  return Math.round(amount * 100);
}

export function centsToMoney(cents: number) {
  if (!Number.isSafeInteger(cents)) throw new Error("invalid_money_cents");
  return cents / 100;
}
