import type { Metadata } from "next";
import { PageShell } from "@/components/site/page-shell";
import { ConfidenceBadge } from "@/components/ui/lineage";
import { LIMITATIONS, METHODOLOGIES } from "@/data/methodologies";
import { SOURCES } from "@/data/sources";

export const metadata: Metadata = {
  title: "Methodology",
  description: "How College Value Lab calculates cost, net cost, loans, salary projections, purchasing power, break-even and opportunity cost, and what the numbers can't tell you.",
};

export default function MethodologyPage() {
  return (
    <PageShell title="Methodology" lede="Every calculation, in plain language, with its formula and its limits. All values are in 2024 dollars.">
      <div className="grid gap-12 lg:grid-cols-[14rem_1fr] lg:gap-16">
        <nav aria-label="On this page" className="hidden lg:sticky lg:top-[calc(var(--nav-h)+24px)] lg:block lg:self-start">
          <ul className="grid gap-1 border-l border-rule">
            {METHODOLOGIES.map((m) => (
              <li key={m.id}>
                <a href={`#${m.id}`} className="-ml-px block border-l border-transparent py-1 pl-4 text-small text-ink-2 hover:border-ink hover:text-ink">
                  {m.title}
                </a>
              </li>
            ))}
            <li>
              <a href="#confidence" className="-ml-px block border-l border-transparent py-1 pl-4 text-small text-ink-2 hover:border-ink hover:text-ink">Data confidence</a>
            </li>
            <li>
              <a href="#limitations" className="-ml-px block border-l border-transparent py-1 pl-4 text-small text-ink-2 hover:border-ink hover:text-ink">Limitations</a>
            </li>
            <li>
              <a href="#sources" className="-ml-px block border-l border-transparent py-1 pl-4 text-small text-ink-2 hover:border-ink hover:text-ink">Data sources</a>
            </li>
          </ul>
        </nav>

        <div className="grid max-w-[46rem] gap-14">
          <p className="rounded-md bg-caution-tint p-4 text-small text-caution">
            This release runs on seeded sample data shaped like the datasets below. The methods are the ones the live product will use; the numbers are illustrative until live data is connected.
          </p>
          {METHODOLOGIES.map((m) => (
            <section key={m.id} id={m.id} aria-labelledby={`${m.id}-h`} className="grid scroll-mt-28 gap-3">
              <h2 id={`${m.id}-h`} className="text-h2 font-bold">{m.title}</h2>
              <p className="text-lede font-medium text-ink">{m.simple}</p>
              {m.formula && <pre className="whitespace-pre-wrap rounded-md border border-rule bg-surface px-4 py-3 font-sans text-small font-semibold text-ink">{m.formula}</pre>}
              {m.body.map((b) => (
                <p key={b} className="text-body text-ink-2">{b}</p>
              ))}
              {m.limitations && (
                <ul className="grid gap-1.5 border-l border-rule-strong pl-4 text-small text-ink-2">
                  {m.limitations.map((l) => (
                    <li key={l}>{l}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          <section id="confidence" aria-labelledby="confidence-h" className="grid scroll-mt-28 gap-3">
            <h2 id="confidence-h" className="text-h2 font-bold">Data confidence</h2>
            <p className="text-body text-ink-2">Each statistic carries a confidence level built from four transparent parts, never a hidden score:</p>
            <table className="w-full text-small">
              <caption className="sr-only">Confidence weights</caption>
              <thead className="text-left text-caption text-muted">
                <tr className="border-b border-rule">
                  <th scope="col" className="py-2 font-medium">Component</th>
                  <th scope="col" className="py-2 font-medium">Weight</th>
                  <th scope="col" className="py-2 font-medium">Full marks when</th>
                </tr>
              </thead>
              <tbody className="text-ink-2">
                <tr className="border-b border-rule"><td className="py-2">Sample size</td><td className="tabular py-2">35%</td><td className="py-2">500 or more people</td></tr>
                <tr className="border-b border-rule"><td className="py-2">Data age</td><td className="tabular py-2">20%</td><td className="py-2">2 years old or newer</td></tr>
                <tr className="border-b border-rule"><td className="py-2">Source quality</td><td className="tabular py-2">25%</td><td className="py-2">Administrative federal data</td></tr>
                <tr className="border-b border-rule"><td className="py-2">Coverage</td><td className="tabular py-2">20%</td><td className="py-2">The whole population is represented</td></tr>
              </tbody>
            </table>
            <div className="flex flex-wrap gap-2">
              <ConfidenceBadge level="high" /> <ConfidenceBadge level="moderate" /> <ConfidenceBadge level="limited" />
            </div>
            <p className="text-small text-muted">High: 80% or more of full marks. Moderate: 60-79%. Limited: below 60%.</p>
          </section>

          <section id="limitations" aria-labelledby="lim-h" className="grid scroll-mt-28 gap-3">
            <h2 id="lim-h" className="text-h2 font-bold">Limitations</h2>
            <ul className="grid gap-3">
              {LIMITATIONS.map((l) => (
                <li key={l} className="flex gap-3 text-body text-ink-2">
                  <span aria-hidden className="mt-[0.7em] h-px w-4 shrink-0 bg-rule-strong" />
                  {l}
                </li>
              ))}
            </ul>
          </section>

          <section id="sources" aria-labelledby="src-h" className="grid scroll-mt-28 gap-3">
            <h2 id="src-h" className="text-h2 font-bold">Data sources</h2>
            <ul className="grid gap-3">
              {Object.values(SOURCES).map((s) => (
                <li key={s.id} className="grid gap-0.5 border-b border-rule pb-3">
                  <span className="text-small font-semibold text-ink">
                    {s.name} <span className="font-normal text-muted">· {s.publisher}</span>
                  </span>
                  <span className="text-small text-ink-2">{s.dataset}</span>
                  {s.url.startsWith("http") && (
                    <a href={s.url} target="_blank" rel="noreferrer" className="w-fit text-caption text-ink-2 underline decoration-rule-strong underline-offset-4 hover:text-ink">
                      {s.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </PageShell>
  );
}
