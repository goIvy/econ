# College Value Lab

Compare the real financial value of a specific college path: one college, one major, one residency, one aid package, one living arrangement. Net cost, debt, earnings ranges, employment and break-even, side by side, with a source for every number and no single "score".

> **Demo data.** This release runs on seeded sample data shaped like the federal datasets it will use (College Scorecard, IPEDS, BLS, ACS, BEA, FRED, Federal Student Aid). Every figure is labeled "Sample data" in the UI and tagged `demo: true` in code until live ingestion is connected.

## What's in this release

The site has one obvious journey: **pick a college, a major and residency, add aid if you have it, see your result, compare another college, then explore deeper if you want.**

| Area | Where |
|---|---|
| Hero with a 3-step "how it works" and a starter card (college, major, residency, optional aid → "See my college path"); the card follows changes made anywhere else and says when edits are not applied yet | `features/start/` |
| Results: five numbers (net cost, expected debt, early-career pay, employment, break-even), "What this means" with the next two actions, details and "View calculation" on demand | `features/results/results.tsx` |
| Advanced analysis (one expandable panel): change the assumptions, and how every number is made | `app/page.tsx` → `features/chapters/` |
| Compare: add a college in one click (search or samples), five numbers side by side, "Show more"; swipe on phones | `features/results/compare.tsx` |
| Sticky "Your path" summary (slim bar on desktop, expandable bar on phones) | `features/results/sticky-summary.tsx` |
| Cost (sticker price − grants = net cost, "Where does the money go?"), Payoff (the head start of working from 18, break-even, play/scrub timeline), Possible futures (1,000-run simulation), 3 featured lessons, data transparency | `features/chapters/` |
| College detail: live hero (follows the major/residency you pick), breadcrumbs, tabs: Overview, Cost, Career outcomes, Majors, Research | `/college/[id]`, `features/college/` |
| Learn: scroll lessons, "What your salary can actually buy" map, 8 quick experiments | `/learn` |
| Explore, majors, full comparison table, saved comparisons, research, methodology | `/explore`, `/majors`, `/compare`, `/saved`, `/research`, `/methodology` |
| FastAPI + PostgreSQL service, 29-table schema | `backend/` |

Every number carries a badge (DATA, ESTIMATE or SIMULATION) and a source. Old links to the retired onboarding, simulator, careers and sign-in pages redirect into this flow. Plain words first, the economics term second ("What you give up. Economists call this opportunity cost.").

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
npm test             # 68 calculation, data and wording tests (vitest)
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

- Full journey (college → major → residency → aid → results → details → advanced → payoff playback → add/remove/compare → simulation) scripted at 390px and 1440px: no console errors, warnings or hydration issues, in dev and production
- axe-core: 0 violations on every route at 375px and 1440px, plus the opened states (details, advanced analysis, dropdowns, simulation)
- No horizontal overflow at 375 / 390 / 430 / 768 / 1024 / 1440 on every route
- Keyboard-only journey works; `prefers-reduced-motion` leaves nothing hidden and the simulation completes instantly
- The same path shows the same numbers on the homepage, its compare section and `/compare`
- Typecheck, lint, 68 tests and the production build pass

## Deploy

Frontend on Vercel (Application Preset: Next.js; `vercel.json` pins it); API on Railway, Render or Fly.io. Configuration is via environment variables only (see `.env.example`). No secrets are committed.
