import { moneyCompact, pct } from "@/lib/format";
import type { DataKind } from "@/components/ui/data-kind";
import type { Future } from "./store";

/**
 * Plain-language facts about one path. Every view (results, guided walk-
 * through, comparison, sticky summary) reads numbers and wording from here so
 * they always agree.
 */
export function residencyLabel(f: Future) {
  if (f.ctx.college.control === "private") return "Private college";
  return f.sel.residency === "resident" ? `${stateName(f.ctx.college.state)} resident` : "Out-of-state";
}

export function residencyShort(f: Future) {
  if (f.ctx.college.control === "private") return "Private";
  return f.sel.residency === "resident" ? "In-state" : "Out-of-state";
}

/** Years after graduation until the path passes working from 18, or null. */
export function breakEvenYears(f: Future) {
  return f.breakEven == null ? null : Math.max(0, f.breakEven - f.result.graduationAge);
}

export const yrs = (v: number | null) => (v == null ? "Not by 40" : `${v.toFixed(1)} yrs`);

export interface Fact {
  key: "cost" | "debt" | "pay" | "jobs" | "breakeven";
  label: string;
  value: string;
  raw: number | null;
  kind: DataKind;
  sub: string;
  why: string;
}

export function primaryFacts(f: Future): Fact[] {
  const r = f.result;
  const be = breakEvenYears(f);
  const pay = f.ctx.outcome.earlyCareer.value;
  return [
    { key: "cost", label: "Net cost", value: moneyCompact(r.net.netPrice), raw: r.net.netPrice, kind: "estimated", sub: `${r.inputs.yearsToGraduate} years, after grants`, why: "Sticker price can be very different from what you actually pay." },
    { key: "debt", label: "Expected debt", value: moneyCompact(r.loan.principal), raw: r.loan.principal, kind: "estimated", sub: r.loan.principal > 0 ? `About ${moneyCompact(r.loan.monthlyPayment)}/mo for 10 years` : "No borrowing needed", why: "Two colleges with similar salaries can end very differently if one needs much more borrowing." },
    { key: "pay", label: "Early-career pay", value: moneyCompact(pay?.p50 ?? r.startingSalary), raw: pay?.p50 ?? r.startingSalary, kind: "observed", sub: "Typical graduate, first years", why: "Pay varies a lot even within one major, so look at the range, not just the middle." },
    { key: "jobs", label: "Employment outlook", value: pct(r.employmentRate * 100), raw: r.employmentRate, kind: "observed", sub: "Working a year after graduating", why: "A high salary means less if graduates struggle to find work." },
    { key: "breakeven", label: "Break-even", value: yrs(be), raw: be, kind: "projected", sub: be == null ? "Earnings don't catch up by 40" : "After graduation, vs. working from 18", why: "This is when higher earnings have paid back the extra cost of this path." },
  ];
}

/** Two short sentences: what this path's numbers add up to. */
export function whatThisMeans(f: Future) {
  const r = f.result;
  const c = f.ctx.college;
  const debt = r.loan.principal;
  const be = breakEvenYears(f);
  const cost =
    c.control === "private"
      ? `As a private college, ${c.shortName} costs about ${moneyCompact(r.net.netPrice)} after grants`
      : f.sel.residency === "resident"
        ? `In-state tuition keeps the net cost near ${moneyCompact(r.net.netPrice)}`
        : `Out-of-state tuition pushes the net cost to about ${moneyCompact(r.net.netPrice)}`;
  const debtPart = debt <= 0 ? ", with no borrowing needed." : debt < 25000 ? `, and estimated debt stays fairly low (${moneyCompact(debt)}).` : `, and you'd borrow about ${moneyCompact(debt)} (≈ ${moneyCompact(r.loan.monthlyPayment)} a month for 10 years).`;
  const payback =
    be == null
      ? "With these numbers, earnings don't recover the extra cost by age 40."
      : be <= 8
        ? `With typical pay for ${f.ctx.major.name.toLowerCase()} graduates, earnings recover that cost about ${be.toFixed(1)} years after graduation.`
        : `Earnings recover that cost more slowly, about ${be.toFixed(1)} years after graduation.`;
  return `${cost}${debtPart} ${payback}`;
}

const STATES: Record<string, string> = { AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California", CO: "Colorado", CT: "Connecticut", DE: "Delaware", DC: "D.C.", FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming" };
export const stateName = (code: string) => STATES[code] ?? code;
