import Link from "next/link";
import { Logo } from "./logo";

const COLUMNS: Array<{ title: string; links: Array<[string, string]> }> = [
  { title: "Tools", links: [["/explore", "College search"], ["/compare", "Compare paths"], ["/simulator", "Cost & debt simulator"], ["/majors", "Majors"]] },
  { title: "Research", links: [["/methodology", "Methodology"], ["/methodology#limitations", "Limitations"], ["/learn", "Learn the economics"], ["/research", "Research lab"], ["/careers", "Careers"]] },
  { title: "Get started", links: [["/get-started", "Set up your comparison"], ["/sign-in", "Sign in"]] },
];

export function Footer() {
  return (
    <footer className="border-t border-rule bg-paper">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-4 py-14 md:grid-cols-[1.3fr_2fr] md:px-8 xl:px-12">
        <div className="grid content-start gap-4">
          <Logo />
          <p className="max-w-sm text-small text-ink-2">
            Compare the real financial value of a specific college and major. Tradeoffs, not rankings, with every number sourced.
          </p>
          <p className="max-w-sm rounded-sm bg-caution-tint px-3 py-2 text-caption text-caution">
            This release runs on seeded sample data shaped like the federal datasets it will use. Figures are illustrative until live data is connected.
          </p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {COLUMNS.map((c) => (
            <div key={c.title} className="grid content-start gap-3">
              <p className="font-display text-small font-semibold text-ink">{c.title}</p>
              <ul className="grid gap-2">
                {c.links.map(([href, label]) => (
                  <li key={href}>
                    <Link href={href} className="text-small text-ink-2 hover:text-ink hover:underline">
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
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3 px-4 py-5 text-caption text-muted md:px-8 xl:px-12">
          <p>© {new Date().getFullYear()} College Value Lab. Estimates are not financial advice and do not predict any individual outcome.</p>
          <p>Built on College Scorecard, IPEDS, BLS, ACS, BEA and FRED data structures.</p>
        </div>
      </div>
    </footer>
  );
}
