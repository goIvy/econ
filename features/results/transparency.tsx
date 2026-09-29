import { ButtonLink } from "@/components/ui/button";
import { DataKindChip, type DataKind } from "@/components/ui/data-kind";

const KINDS: Array<{ kind: DataKind; text: string; example: string }> = [
  { kind: "observed", text: "Reported in a public dataset.", example: "Median salary, employment rate, tuition" },
  { kind: "estimated", text: "Calculated from data with a stated method.", example: "Net cost, debt, break-even" },
  { kind: "simulated", text: "The result of many randomized futures.", example: "Chance of breaking even in 10 years" },
];

const SOURCES = ["College Scorecard", "IPEDS", "Bureau of Labor Statistics", "American Community Survey", "BEA regional prices", "Federal Student Aid"];

/** Where the numbers come from, in one screen. Details live on /methodology and /research. */
export function Transparency() {
  return (
    <div className="grid gap-10">
      {/* a legend, read top to bottom: what kind of number, what it means, examples */}
      <ol className="border-t border-rule">
        {KINDS.map((k, i) => (
          <li key={k.kind} className="grid gap-2 border-b border-rule py-5 md:grid-cols-[3rem_10rem_1fr_minmax(0,18rem)] md:items-baseline md:gap-6">
            <span className="tabular hidden font-mono text-[11px] text-accent-ink md:block">0{i + 1}</span>
            <DataKindChip kind={k.kind} className="justify-self-start" />
            <p className="text-body font-medium text-ink">{k.text}</p>
            <p className="text-small text-muted">e.g. {k.example}</p>
          </li>
        ))}
      </ol>
      <div className="grid gap-6 md:grid-cols-12 md:items-end">
        <div className="grid gap-3 md:col-span-8">
          <p className="text-small font-medium text-ink">Built on public data from</p>
          <ul className="flex flex-wrap gap-2">
            {SOURCES.map((s) => (
              <li key={s} className="rounded-full bg-surface px-3.5 py-1.5 text-caption text-ink-2 shadow-[0_0_0_1px_var(--rule),var(--hairline-inset)]">
                {s}
              </li>
            ))}
          </ul>
          <p className="text-caption text-muted">This preview runs on sample data shaped like these sources; every figure is labeled until live data is connected. No college gets a single score.</p>
        </div>
        <div className="flex flex-wrap gap-3 md:col-span-4 md:justify-end">
          <ButtonLink href="/methodology" variant="secondary" trail>
            How it&apos;s calculated
          </ButtonLink>
          <ButtonLink href="/research" variant="quiet">
            Research
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
