# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

- Frontend: Next.js (latest stable, 16.x) App Router, React, TypeScript, Tailwind CSS, shadcn/ui primitives, Recharts (D3 only where Recharts can't express a chart), Framer Motion for all motion.
- Backend: Python FastAPI service, PostgreSQL, SQLAlchemy. pandas / NumPy / statsmodels / scipy for data work.
- Deploy targets: Vercel (web), Railway / Render / Fly.io (API).
- Auth provider (Clerk, Supabase Auth, or Auth.js) is **undecided**; accounts are outside the first build.
- Source: the owner's product spec (sections 1–16 are the first build). The aesthetic brief named Next.js 14; the owner deferred to the spec's "latest stable".

## Users

- **High-school students** (freshman to senior) weighing which colleges and majors to apply to or accept, often with a family budget in the background and little financial vocabulary.
- **Parents** paying for or co-signing the decision; they care most about cost, debt, aid, monthly loan payments, and risk.
- **Current college students** reconsidering a major, a transfer, or how much to borrow.
- **Counselors** building comparisons for many students (a dedicated counselor mode comes later).

Their job: understand what a specific college + major + residency + aid combination is likely to cost and return, compared with their other real options, before committing years and tens of thousands of dollars.

## Product Purpose

College Value Lab answers: *"What is the real financial value of attending this specific college for this specific major?"* Users choose college, major, residency, aid, scholarships, living arrangement, expected debt, career interest, and post-graduation location. The product then calculates and visualizes cost, net cost, debt, graduation and employment likelihood, earnings distributions, loan payments, break-even timing, and long-run trajectories, and puts several paths side by side.

Success means a family leaves understanding the tradeoffs between their actual options and the economic ideas behind them, without being told which school to pick.

## Positioning

Not a ranking and not a calculator. It models a *path* (a specific college × major × residency × aid × living arrangement), not an institution. Every number is traceable to source, year, dataset, population, and methodology. It shows uncertainty and distributions rather than one averaged answer.

## Operating Context

- Families compare 2–5 concrete options, often during application season or after aid letters arrive.
- Frequently used on phones; comparisons must work as stacked cards on mobile.
- Counselors and parents may review the same comparison later (shareable links come after the first build).

## Capabilities and Constraints

First build (spec sections 1–16):
- Homepage with an immediate interactive demo (college, major, residency, aid → animated results, then "Compare another path").
- Onboarding after "Get Started": six skippable steps (compare goal, grade, colleges, majors, home state, optional financial assumptions).
- College search by name / state / city with filters (public/private, state, tuition, net price, graduation rate, acceptance rate, enrollment, debt, earnings, major availability); compare up to 5 colleges.
- College detail page: header, main cost/outcome metrics, tabs (Overview, Costs, Majors, Earnings, Debt, Outcomes, Research), trends over time.
- Major selector with salary percentiles, mid-career estimate, employment, unemployment, occupations, industries, grad-school rate.
- Residency toggle that recalculates tuition, total cost, debt, break-even, and long-term return, with animated change.
- Total cost model (tuition, fees, room, board, books, transportation, misc.) minus aid, scholarships, family contribution, work income, savings → net student cost.
- Living arrangement (campus, off-campus, at home) that changes rent, food, transportation, total.
- Debt model: principal, rate, loan type, term → monthly payment, total interest, total repayment, payoff years, interactive balance curve.
- Graduation probability (4- and 6-year) and employment model (employment, unemployment, underemployment only if defensible, grad-school rate, occupations, time to first job if data exists).
- Relational schema for all spec tables with indexes, foreign keys, and dataset year/source tracking.

Constraints:
- Never collapse a college into a single score; never say one option is "better".
- Every displayed statistic carries source, year, dataset, population, methodology ("View Source").
- Individual outcomes are never implied to be guaranteed; projections are labeled as estimates.
- All data is seeded demo data until live sources are wired in: at least 100 colleges, 50 majors, 100 occupations, 50 cities, tagged as demo internally and labeled in the UI.
- Components must be modular so live datasets can replace seeds without frontend redesign.

## Brand Commitments

- Name: **College Value Lab**.
- Voice: clear, smart, friendly, nonjudgmental, concise, credible. "Here is how the financial tradeoff changes," never "You should choose…".
- Owner-specified copy: hero heading "Understand the Real Value of College.", subheading "Compare colleges, majors, tuition, debt, employment, salaries, and long-term financial outcomes using real economic data.", CTAs "Compare Colleges" and "Explore the Simulator", demo button "Calculate My Path".
- Binding visual constraints the owner stated (recorded, not expanded): light-first; warm off-white, deep navy/charcoal, blue and teal accents, restrained green (positive), muted amber (caution), soft red (risk only); gradients only in hero, chart emphasis, CTA accents; no gradient text, no glassmorphism by default, no identical card grids, no side-stripe card borders; no Inter, Roboto, or Arial; all color and type from `design-system/MASTER.md`.

## Evidence on Hand

- No live data yet. Planned sources: College Scorecard, IPEDS, BLS, American Community Survey, BEA, FRED, Federal Student Aid, Common Data Sets, university outcome reports. These can be named as the data the product is built on.
- No customers, testimonials, press, or usage numbers. Do not fabricate any.
- No pricing has been set. A pricing section may appear only with content clearly labeled as placeholder.
- No logo, illustration, or photography assets exist.

## Product Principles

1. Show tradeoffs, not verdicts.
2. Every number can answer "where did this come from?"
3. Simple conclusion first, depth on demand (progressive disclosure).
4. Teach the economics as you go: opportunity cost, expected value, risk, purchasing power, NPV, debt burden, selection bias, correlation vs. causation.
5. Show uncertainty and distributions honestly, not false precision.

## Accessibility & Inclusion

- Charts get text summaries, keyboard navigation, colorblind-safe palettes, and never rely on color alone.
- `prefers-reduced-motion` respected on every animation.
- Mobile-first; verified at 375 / 768 / 1024 / 1440 px.
- Plain-language explanations for every complex metric; audience includes teenagers and first-generation families.
