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
      <ul className="grid gap-3 md:grid-cols-3">
        {KINDS.map((k) => (
          <li key={k.kind} className="grid content-start gap-2 rounded-md border border-rule bg-surface p-5">
            <DataKindChip kind={k.kind} className="justify-self-start" />
            <p className="text-small font-semibold text-ink">{k.text}</p>
            <p className="text-caption text-muted">e.g. {k.example}</p>
          </li>
        ))}
      </ul>
      <div className="grid gap-6 md:grid-cols-12 md:items-end">
        <div className="grid gap-3 md:col-span-8">
          <p className="text-small font-semibold text-ink">Built on public data from</p>
          <ul className="flex flex-wrap gap-2">
            {SOURCES.map((s) => (
              <li key={s} className="rounded-full border border-rule px-3 py-1 text-caption text-ink-2">
                {s}
              </li>
            ))}
          </ul>
          <p className="text-caption text-muted">This preview runs on sample data shaped like these sources; every figure is labeled until live data is connected. No college gets a single score.</p>
        </div>
        <div className="flex flex-wrap gap-3 md:col-span-4 md:justify-end">
          <ButtonLink href="/methodology" variant="secondary">
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
