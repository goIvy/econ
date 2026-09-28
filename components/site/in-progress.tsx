import Link from "next/link";
import { PageShell } from "./page-shell";
import { ButtonLink } from "@/components/ui/button";

/** Honest status page for areas scheduled after the first release. */
export function InProgress({
  title,
  lede,
  coming,
  meanwhile,
}: {
  title: string;
  lede: string;
  coming: string[];
  meanwhile: Array<{ href: string; label: string; note: string }>;
}) {
  return (
    <PageShell title={title} lede={lede}>
      <div className="grid gap-12 lg:grid-cols-2">
        <section aria-labelledby="coming-h" className="grid content-start gap-4">
          <h2 id="coming-h" className="text-h3 font-[650]">What this will include</h2>
          <ul className="grid gap-2">
            {coming.map((c) => (
              <li key={c} className="flex gap-3 text-body text-ink-2">
                <span aria-hidden className="mt-[0.7em] h-px w-4 shrink-0 bg-rule-strong" />
                {c}
              </li>
            ))}
          </ul>
          <p className="text-small text-muted">This area is planned for a later release. Nothing here is live yet.</p>
        </section>
        <section aria-labelledby="now-h" className="grid content-start gap-4">
          <h2 id="now-h" className="text-h3 font-[650]">You can use now</h2>
          <ul className="grid gap-3">
            {meanwhile.map((m) => (
              <li key={m.href}>
                <Link href={m.href} className="group grid gap-1 rounded-md border border-rule bg-surface p-4 shadow-1 transition-[border-color,box-shadow] hover:border-rule-strong hover:shadow-2">
                  <span className="font-semibold text-ink group-hover:underline">{m.label}</span>
                  <span className="text-small text-ink-2">{m.note}</span>
                </Link>
              </li>
            ))}
          </ul>
          <ButtonLink href="/get-started" className="justify-self-start">
            Get started
          </ButtonLink>
        </section>
      </div>
    </PageShell>
  );
}
