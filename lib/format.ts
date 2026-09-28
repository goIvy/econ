/** Number formatting. Every figure the UI shows goes through these. */

const usd0 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const usd2 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const int = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

export const money = (n: number | null | undefined) => (n == null || !Number.isFinite(n) ? "—" : usd0.format(Math.round(n)));
export const moneyCents = (n: number | null | undefined) => (n == null || !Number.isFinite(n) ? "—" : usd2.format(n));
export const number = (n: number | null | undefined) => (n == null || !Number.isFinite(n) ? "—" : int.format(n));
export const pct = (n: number | null | undefined, digits = 0) => (n == null || !Number.isFinite(n) ? "—" : `${n.toFixed(digits)}%`);

/** $78.4K / $1.2M style, for axes and tight spaces. */
export function moneyCompact(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const sign = n < 0 ? "−" : "";
  const a = Math.abs(n);
  if (a >= 1_000_000) return `${sign}$${(a / 1_000_000).toFixed(a >= 10_000_000 ? 0 : 1).replace(/\.0$/, "")}M`;
  if (a >= 1_000) return `${sign}$${(a / 1_000).toFixed(a >= 100_000 ? 0 : 1).replace(/\.0$/, "")}K`;
  return `${sign}$${Math.round(a)}`;
}

/** "about 8.2 years" style. */
export const years = (n: number) => `${n.toFixed(1).replace(/\.0$/, "")} ${Math.abs(n - 1) < 0.05 ? "year" : "years"}`;
