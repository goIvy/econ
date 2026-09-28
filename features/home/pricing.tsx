import { Check, Minus } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";

/**
 * PLACEHOLDER PRICING. No prices have been decided (PRODUCT.md). The tiers
 * and features below are structure only and are labeled as such on screen.
 */
const TIERS = [
  { name: "Students", price: "Free", note: "Placeholder", cta: "Get started", href: "/get-started" },
  { name: "Families", price: "$—", note: "Placeholder price", cta: "Join the waitlist", href: "/get-started" },
  { name: "Counselors", price: "$—", note: "Placeholder price", cta: "Talk to us", href: "/get-started" },
];

const FEATURES: Array<[string, [boolean, boolean, boolean]]> = [
  ["Compare up to 5 college paths", [true, true, true]],
  ["Cost, debt and break-even calculators", [true, true, true]],
  ["Sources and methodology for every number", [true, true, true]],
  ["Saved paths and shareable links", [false, true, true]],
  ["Parent view: cost, debt and monthly payments", [false, true, true]],
  ["Student roster and exportable reports", [false, false, true]],
];

export function Pricing() {
  return (
    <Reveal>
      <div className="mb-6 flex items-start gap-3 rounded-md border border-caution/30 bg-caution-tint px-4 py-3 text-small text-caution" role="note">
        <span className="font-semibold">Placeholder pricing, not final.</span>
        <span>Tiers and prices haven&apos;t been decided. This table shows structure only.</span>
      </div>
      {/* phones: one block per tier */}
      <div className="grid gap-4 md:hidden">
        {TIERS.map((t, ti) => (
          <div key={t.name} className="rounded-lg border border-rule bg-surface p-5 shadow-1">
            <p className="font-display text-[1.15rem] font-semibold text-ink">{t.name}</p>
            <p className="font-display text-h3 font-bold text-ink">{t.price}</p>
            <p className="text-caption text-muted">{t.note}</p>
            <ul className="mt-4 grid gap-2">
              {FEATURES.filter(([, on]) => on[ti]).map(([f]) => (
                <li key={f} className="flex gap-2 text-small text-ink-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-gain" aria-hidden /> {f}
                </li>
              ))}
            </ul>
            <ButtonLink href={t.href} variant={ti === 0 ? "primary" : "secondary"} size="sm" className="mt-5">
              {t.cta}
            </ButtonLink>
          </div>
        ))}
      </div>
      <div className="hidden overflow-x-auto rounded-lg border border-rule bg-surface shadow-2 md:block">
        <table className="w-full min-w-[40rem] text-small">
          <caption className="sr-only">Placeholder pricing tiers (not final)</caption>
          <thead>
            <tr className="border-b border-rule">
              <th scope="col" className="w-[40%] px-5 py-5 text-left align-bottom font-medium text-muted">What&apos;s included</th>
              {TIERS.map((t) => (
                <th key={t.name} scope="col" className="px-5 py-5 text-left align-bottom font-normal">
                  <span className="block font-display text-[1.15rem] font-semibold text-ink">{t.name}</span>
                  <span className="mt-1 block font-display text-h3 font-bold text-ink">{t.price}</span>
                  <span className="block text-caption text-muted">{t.note}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FEATURES.map(([f, on]) => (
              <tr key={f} className="border-b border-rule">
                <th scope="row" className="px-5 py-3 text-left font-normal text-ink-2">{f}</th>
                {on.map((v, i) => (
                  <td key={i} className="px-5 py-3">
                    {v ? <Check className="size-4 text-gain" aria-label="Included" /> : <Minus className="size-4 text-rule-strong" aria-label="Not included" />}
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <td className="px-5 py-5" />
              {TIERS.map((t, i) => (
                <td key={t.name} className="px-5 py-5">
                  <ButtonLink href={t.href} variant={i === 0 ? "primary" : "secondary"} size="sm">
                    {t.cta}
                  </ButtonLink>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </Reveal>
  );
}
