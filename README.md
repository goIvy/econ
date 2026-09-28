# College Value Lab

Compare the real financial value of a specific college path: one college, one major, one residency, one aid package, one living arrangement. Net cost, debt, earnings ranges, employment and break-even, side by side, with a source for every number and no single "score".

> **Demo data.** This release runs on seeded sample data shaped like the federal datasets it will use (College Scorecard, IPEDS, BLS, ACS, BEA, FRED, Federal Student Aid). Every figure is labeled "Sample data" in the UI and tagged `demo: true` in code until live ingestion is connected.

## What's in this release (spec sections 1–16)

| Area | Where |
|---|---|
| Interactive homepage: branching-paths hero (A public, B private, C work from 18), scroll-driven net-price story, two-students opportunity cost, Your Financial Timeline, What-If Lab, debt you can see, drag-to-compare stage with flip cards, salary distribution explorer, 1,000 Possible Futures (Monte Carlo), purchasing-power map, lessons, sources, methodology, placeholder pricing, FAQ | `app/page.tsx`, `features/experience/`, `features/home/` |
| Learn the Economics: five scroll-told interactive lessons, plus concept tooltips with working examples | `/learn`, `features/learn/`, `components/concepts/` |
| Onboarding (6 skippable steps) | `/get-started`, `features/onboarding/` |
| College search with filters and compare tray (up to 5) | `/explore`, `features/college/` |
| College detail: metrics + Overview, Costs, Majors, Earnings, Debt, Outcomes, Research tabs | `/college/[id]` |
| Major selector, residency toggle, total cost model, living arrangement, debt model, graduation probability, employment model | `features/major`, `features/cost`, `features/debt`, `features/outcomes` |
| Compare paths (sortable, filterable, shareable URL) | `/compare`, `features/comparison/` |
| Cost and debt simulator | `/simulator` |
| Methodology page + methodology modal | `/methodology`, `components/ui/methodology-dialog.tsx` |
| FastAPI + PostgreSQL service, 29-table schema | `backend/` |

Careers, Research lab and accounts are later-release areas. Their pages say so honestly.

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
npm test             # 56 calculation + data tests (vitest)
npm run typecheck
npm run lint
npm run build
```

Backend: see [backend/README.md](backend/README.md).

## How it's built

- **Next.js 16** App Router, React 19, TypeScript, **Tailwind v4**, Radix primitives (shadcn-style components written in-repo), **Recharts** for standard charts, custom SVG for the signature trace chart, **Framer Motion** for all motion.
- **Design system:** `design-system/MASTER.md` is the single source of truth. Tokens live in `app/globals.css`, motion variants in `lib/animations.ts`. Direction: *Calibrated Instrument*: a measured field, navy ink, blue/teal trace inks, tabular readouts, a footnote on every figure.
- **Calculation engine:** `lib/calc/` (TypeScript), mirrored in `backend/app/calc.py` with a parity test. It covers net cost, loan amortization, in-school interest, 2024 taxes, salary projection, purchasing power, cumulative value, break-even and opportunity cost, plus timeline snapshots, teaching models, marginal (what-if) analysis and a seeded Monte Carlo simulation. All values are in 2024 dollars. No animation code lives here.
- **Interaction layer:** reusable motion primitives in `components/motion`, springs and variants in `lib/animations.ts`, rules in `design-system/MASTER.md` §6.1. Every animation respects `prefers-reduced-motion`; cursor effects run only on fine pointers.
- **Map:** `npm run build:map` regenerates `data/geo/us-map.ts` (simplified Albers USA outline from us-atlas); no mapping library ships to the browser.
- **Data layer:** `data/seed/` (demo rows) → `data/build.ts` (typed, lineage-tagged entities) → `services/data.ts` (the only seam components read through; swap for the API without touching UI).
- **Lineage:** every metric is `{ value, lineage: { sourceId, year, population, sampleSize, confidence, demo } }`, rendered by the "View source" footnote.
- **API:** `POST /api/path` (validated with zod, rate-limited) runs a path for the interactive demos.

```
app/          routes
components/   ui primitives, charts, site chrome
features/     home, college, comparison, cost, debt, major, outcomes, onboarding, simulator
lib/          calc engine, animations, formatting, api schemas
data/         seed rows, sources, methodologies
services/     data access seam
hooks/        client hooks
types/        domain types
tests/        vitest
backend/      FastAPI + SQLAlchemy + pytest
```

## Quality checks run

- axe-core: 0 violations on 11 routes at 375px and 1440px
- Production homepage: LCP ≈ 0.45s locally, no long tasks while scrolling the full page
- No horizontal overflow at 375 / 768 / 1024 / 1440
- `prefers-reduced-motion` respected on every animation (hydration-safe)
- Motion audit report: `motion-audits/college-value-lab-2026-09-28.html`

## Deploy

Frontend on Vercel; API on Railway, Render or Fly.io. Configuration is via environment variables only (see `.env.example`). No secrets are committed.
