import Link from "next/link";
import { Logo } from "./logo";

const COLUMNS: Array<{ title: string; links: Array<[string, string]> }> = [
  { title: "Start", links: [["/#starter", "Build your path"], ["/compare", "Compare colleges"], ["/saved", "Saved comparisons"]] },
  { title: "Explore", links: [["/explore", "Colleges"], ["/shelf", "The elite shelf"], ["/majors", "Majors"], ["/learn", "Learn the economics"]] },
  { title: "Data", links: [["/methodology", "How it's calculated"], ["/methodology#limitations", "Limitations"], ["/research", "Research"]] },
];

export function Footer() {
  return (
    <footer className="relative border-t border-rule bg-paper">
      <div className="mx-auto grid max-w-[1200px] gap-12 px-4 pb-10 pt-16 md:grid-cols-[1.2fr_2fr] md:px-8 md:pt-20">
        <div className="grid content-start gap-4">
          <Logo />
          <p className="max-w-sm text-small text-ink-2">Compare the real financial value of a specific college and major. Tradeoffs, not rankings, and a source for every number.</p>
          <p className="max-w-sm rounded-sm bg-caution-tint px-3 py-2 text-caption text-caution">This preview runs on sample data shaped like the federal datasets it will use. Figures are illustrative until live data is connected.</p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {COLUMNS.map((c) => (
            <div key={c.title} className="grid content-start gap-3">
              <p className="text-small font-semibold text-ink">{c.title}</p>
              <ul className="grid gap-2.5">
                {c.links.map(([href, label]) => (
                  <li key={href}>
                    <Link href={href} className="text-small text-ink-2 transition-colors hover:text-ink">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <div className="border-t border-rule">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-4 py-6 text-caption text-muted md:px-8">
          <p>
            © {new Date().getFullYear()} College Value Lab. Estimates, not financial advice.{" "}
            <Link href="/privacy" className="underline decoration-rule-strong underline-offset-4 hover:text-ink">
              Privacy
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
