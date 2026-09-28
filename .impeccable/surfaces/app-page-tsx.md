---
version: 1
slug: "app-page-tsx"
primary_target: "app/page.tsx"
related_targets: []
---

## Scope and mode

Homepage (`app/page.tsx`). Visitor mode: **Persuade**. The app routes it links into (search, college detail, calculators) are Operate surfaces inside the same world.

## Audience, job, proof

- Students (grades 9–12, current college students), parents, counselors arriving with 2–5 real options in mind.
- Job: see within one viewport that this tool models *their* path, not a ranking, and try it.
- Proof: the live demo itself, sourced numbers with footnotes, the named public datasets (College Scorecard, IPEDS, BLS, ACS, BEA, FRED, Federal Student Aid). No customers, testimonials or usage stats exist; none are invented. The pricing section carries placeholder tiers labeled "Placeholder pricing — not final".

## Direction contract

THESIS: A college decision is an experiment you can run. The page is a precision instrument that measures a path, not a brochure that ranks schools. It refuses the fintech default of headline, dashboard screenshot and three feature cards.

OWN-WORLD: Warm off-white field ruled by a faint 8/40px measured grid; navy ink; blue and teal "trace inks" that identify Path A and Path B (with letter tags and line styles); tick-marked axis rules as section dividers; readouts in tabular Geist numerals with units in muted ink and a footnote marker on every figure; graduated sliders; segmented ink toggles; Schibsted Grotesk headlines, confident and untracked.

STORY: The visitor learns that the true cost and payoff of college depend on the exact path (college × major × residency × aid × living), sees it computed live with sources, compares a second path and watches where the lines cross, then starts their own comparison.

FIRST VIEWPORT: Desktop: the headline "Understand the Real Value of College." and subheading span the left 5 of 12 columns, with "Compare Colleges" (primary) and "Explore the Simulator" below. The right 7 columns hold the instrument: a large rounded panel with four controls (College, Major, Residency, Aid/yr) and "Calculate My Path", then five readouts and a cumulative-net-value chart where trace A draws. The panel's lower edge sits just above the fold. Mobile: headline, CTAs, then the instrument full-width with controls stacked. The chart stays visible and scrolls vertically, never sideways.

FORM: Calibrated Instrument (candidate 5 of 7 on the grounded list: 1 data-journalism explainer, 2 decoded aid-letter ledger, 3 transit map of paths, 4 economics-textbook figure plates, 5 calibrated instrument / lab, 6 trail elevation profile, 7 campus viewbook). Seed key 65917dda (degraded roll: roll service unreachable, no challengers). Signature interaction: "Compare another path" adds trace B, both readout columns animate side by side, and the break-even crossing marker settles in with its estimate caption.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved

- Real data sources are not yet wired; all figures are seeded demo data and labeled as such.
- Pricing tiers are placeholders pending owner decision.
