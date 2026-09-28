# College Value Lab

Compare the real financial value of a specific college path: one college, one major, one residency, one aid package, one living arrangement. Net cost, debt, earnings ranges, employment and break-even, side by side, with a source for every number and no single "score".

> **Demo data.** This release runs on seeded sample data shaped like the federal datasets it will use (College Scorecard, IPEDS, BLS, ACS, BEA, FRED, Federal Student Aid). Every figure is labeled "Sample data" in the UI and tagged `demo: true` in code until live ingestion is connected.

## What's in this release

| Area | Where |
|---|---|
| Homepage: Three Futures hero (build up to three paths, staggered timeline markers, floating cards, cursor-reactive background), True Cost scroll story, drag-to-compare stage (up to 4 paths across Cost, Career, Risk, Long term), opportunity cost with sliders, salary distribution explorer, employment outcomes (100 graduates regrouping), break-even explorer with scrubber and PLAY MY FUTURE, What-If Lab with change indicators, 1,000 Possible Futures simulation (canvas), cost-of-living map, 8 lessons that expand into micro-experiences, methodology pipeline | `app/page.tsx`, `features/hero/`, `features/chapters/`, `features/home/` |
| Shared scenario state: the paths you build in the hero drive every chapter below it; `/api/context` loads any college + major | `features/scenario/`, `app/api/context/` |
| College detail: big-metric hero with a scrubbable timeline and a college switcher (arrows, ← → keys, swipe; View Transitions), plus Overview, Costs, Majors, Earnings, Debt, Outcomes, Research tabs | `/college/[id]`, `features/college/` |
| Saved comparisons (stored in the browser) | `/saved`, `features/saved/`, `hooks/use-saved.ts` |
| Research: net price vs. earnings across colleges, and break-even age by major | `/research`, `features/research/` |
| Learn the Economics, onboarding, college search, compare workspace, simulator, methodology | `/learn`, `/get-started`, `/explore`, `/compare`, `/simulator`, `/methodology` |
| FastAPI + PostgreSQL service, 29-table schema | `backend/` |

Every number carries a data kind (Observed, Estimated, Projected, Simulated) and an ⓘ source card. Careers and accounts are later-release areas; their pages say so.

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
npm test             # 61 calculation + data tests (vitest)
npm run typecheck
npm run lint
npm run build
```

Backend: see [backend/README.md](backend/README.md).

## How it's built

- **Next.js 16** App Router, React 19, TypeScript, **Tailwind v4**, Radix primitives (shadcn-style components written in-repo), **Recharts** for standard charts, custom SVG for the signature trace chart, **Framer Motion** for all motion.
- **Design system:** `design-system/MASTER.md` is the single source of truth. Tokens live in `app/globals.css`, motion variants in `lib/animations.ts`. Direction (v2): dark-to-light hybrid, Geist, navy grounds with #6C7CFF / #36D1B4 / #A78BFA accents; paths as the core metaphor. Summary in `DESIGN.md`.
- **Calculation engine:** `lib/calc/` (TypeScript), mirrored in `backend/app/calc.py` with a parity test. It covers net cost, loan amortization, in-school interest, 2024 taxes, salary projection, purchasing power, cumulative value, break-even and opportunity cost, plus timeline snapshots, teaching models, marginal (what-if) analysis and a seeded Monte Carlo simulation. All values are in 2024 dollars. No animation code lives here.
- **Interaction layer:** reusable motion primitives in `components/motion`, springs and variants in `lib/animations.ts`, rules in `design-system/MASTER.md` §6.1. Every animation respects `prefers-reduced-motion`; cursor effects run only on fine pointers.
- **Map:** `npm run build:map` regenerates `data/geo/us-map.ts` (simplified Albers USA outline from us-atlas); no mapping library ships to the browser.
- **Data layer:** `data/seed/` (demo rows) → `data/build.ts` (typed, lineage-tagged entities) → `services/data.ts` (the only seam components read through; swap for the API without touching UI).
- **Lineage:** every metric is `{ value, lineage: { sourceId, year, population, sampleSize, confidence, demo } }`, rendered by the "View source" footnote.
- **API:** `POST /api/path` (validated with zod, rate-limited) runs a path for the interactive demos.

```
app/          routes
components/   ui primitives, charts, site chrome
features/     hero, chapters, scenario, home, college, comparison, saved, research, cost, debt, major, outcomes, onboarding, simulator
lib/          calc engine, animations, formatting, api schemas
data/         seed rows, sources, methodologies
services/     data access seam
hooks/        client hooks
types/        domain types
tests/        vitest
backend/      FastAPI + SQLAlchemy + pytest
```

## Quality checks run

- axe-core: 0 violations on 13 routes at 375px and 1440px
- No horizontal overflow at 375 / 768 / 1024 / 1440 on every route
- `prefers-reduced-motion` respected on every animation; nothing is left hidden when motion is off
- Typecheck, lint, 61 tests and the production build all pass

## Deploy

Frontend on Vercel (Application Preset: Next.js; `vercel.json` pins it); API on Railway, Render or Fly.io. Configuration is via environment variables only (see `.env.example`). No secrets are committed.
