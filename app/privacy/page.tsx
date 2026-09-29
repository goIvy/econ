import type { Metadata } from "next";
import { PageShell } from "@/components/site/page-shell";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What College Value Lab stores: your saved comparisons, in your own browser. No accounts, no tracking.",
};

const POINTS: Array<[string, string]> = [
  ["No accounts", "You never sign up or log in. There is nothing to create, and nothing about you on a server."],
  ["Saved comparisons stay in your browser", "When you save a comparison, it is kept in this browser's local storage. Clearing your browser data removes it."],
  ["Calculations run on your device", "Costs, debt and projections are calculated in your browser from the data shipped with the page."],
];

export default function PrivacyPage() {
  return (
    <PageShell title="Privacy" lede="Short version: we don't know who you are, and we don't want to.">
      <dl className="grid max-w-[46rem] gap-8">
        {POINTS.map(([t, d]) => (
          <div key={t} className="grid gap-1.5 border-t border-rule pt-5">
            <dt className="text-h3 font-semibold text-ink">{t}</dt>
            <dd className="text-body text-ink-2">{d}</dd>
          </div>
        ))}
      </dl>
    </PageShell>
  );
}
