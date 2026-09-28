import Link from "next/link";
import { LIMITATIONS } from "@/data/methodologies";

const FORMULAS: Array<{ name: string; formula: string; plain: string }> = [
  {
    name: "Net student cost",
    formula: "Gross cost − Aid − Scholarships − Family contribution",
    plain: "What remains for the student after money that doesn't need to be repaid.",
  },
  {
    name: "Monthly loan payment",
    formula: "P × r ÷ (1 − (1 + r)⁻ⁿ)",
    plain: "Standard amortization, the same as the federal 10-year Standard plan.",
  },
  {
    name: "Purchasing power",
    formula: "Salary × 100 ÷ Regional price parity",
    plain: "What a salary buys compared with an average-priced U.S. metro.",
  },
  {
    name: "Break-even",
    formula: "First age where cumulative value stays above the alternative",
    plain: "Cumulative value = after-tax earnings − college costs − loan payments.",
  },
];

/** Section 10: formulas in the open, limitations stated plainly. */
export function MethodologyCredibility() {
  return (
    <div className="grid gap-12 lg:grid-cols-12">
      <div className="lg:col-span-7">
        <dl className="grid gap-0 border-t border-ink/30">
          {FORMULAS.map((f) => (
            <div key={f.name} className="grid gap-1 border-b border-rule py-5 md:grid-cols-[11rem_1fr] md:gap-6">
              <dt className="font-display text-[1.05rem] font-semibold text-ink">{f.name}</dt>
              <dd className="grid gap-1">
                <code className="w-fit rounded-xs bg-surface-sunk px-2 py-1 font-sans text-small font-semibold text-ink">{f.formula}</code>
                <span className="text-small text-ink-2">{f.plain}</span>
              </dd>
            </div>
          ))}
        </dl>
        <Link href="/methodology" className="mt-6 inline-block text-small font-semibold text-ink underline decoration-rule-strong underline-offset-4 hover:decoration-ink">
          Read the full methodology
        </Link>
      </div>
      <div className="lg:col-span-5">
        <div className="rounded-lg bg-ink p-6 text-surface sm:p-8">
          <p className="font-display text-h3 font-semibold text-surface">What this can&apos;t tell you</p>
          <ul className="mt-5 grid gap-3">
            {LIMITATIONS.map((l) => (
              <li key={l} className="flex gap-3 text-small text-surface/85">
                <span aria-hidden className="mt-[0.55em] h-px w-3 shrink-0 bg-surface/50" />
                {l}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
