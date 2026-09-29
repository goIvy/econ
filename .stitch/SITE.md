# SITE.md: College Value Lab

> Project constitution for the Stitch build loop (`stitch-utilities:site-md`). The visual rules live in `/DESIGN.md`.

## 1. Core Identity

- **Project Name:** College Value Lab
- **Stitch Project ID:** [Stitch Project ID] (not created yet; the Stitch API was not reachable from the build environment)
- **Mission:** Show a student what a specific college and major are really worth: the true cost after grants, likely debt, starting pay, job outlook and when college pays for itself, compared side by side.
- **Target Audience:** High-school juniors and seniors, their families, and counselors. Mostly on phones, often comparing two or three offers.
- **Voice:** Plain, calm, specific. Economics terms come second ("What you give up. Economists call this opportunity cost."). Never a verdict or a single score.

## 2. Visual Language

- **Primary vibe:** Gallery-airy instrument
- **Secondary vibe:** Warm, tactile premium (one ember accent, double-bezel shells, a 3D graduation cap)
- **Tertiary vibe:** Honest data journalism (every number labelled DATA / ESTIMATE / SIMULATION and "Sample data")

## 3. Architecture & File Structure

- **Framework:** Next.js 16 (App Router), React 19, Tailwind v4 tokens in `app/globals.css`.
- **Routes:** `app/<route>/page.tsx`; features in `features/<area>/`; shared UI in `components/ui/`; site chrome in `components/site/`.
- **Asset flow (Stitch loop):** Stitch output goes to `.stitch/queue/`, then is validated against DESIGN.md and ported into React components. Stitch HTML is never shipped directly.
- **Navigation strategy:** floating glass island nav (Explore, Compare, Learn, Research, Saved, "Start comparing"). The homepage is one guided journey with numbered sections 01-07 and a sticky path summary.

## 4. Live Sitemap

- [x] `/`: hero with 3D cap, path builder, results bento, compare, cost, payoff, possible futures, learn, data, final call to action
- [x] `/explore`: search and filter colleges
- [x] `/college/[id]`: one college and major, payoff timeline, browse with ← →
- [x] `/compare`: up to five paths side by side
- [x] `/majors`: majors index
- [x] `/learn`: all economics lessons
- [x] `/research`: research findings with charts
- [x] `/methodology`: how every number is calculated
- [x] `/saved`: comparisons saved in this browser
- [x] `/privacy`: what is stored and where
- [ ] Live data connection (College Scorecard / IPEDS) replacing the labelled sample data

## 5. The Roadmap (Backlog)

**High priority**
- Connect live College Scorecard data; remove the "Sample data" chips only for figures that are actually live.
- Create the Stitch project from DESIGN.md and regenerate the homepage and college page for a side-by-side design review.

**Medium priority**
- Shareable comparison links (state in the URL, no accounts).
- Printable one-page comparison for counselors.

**Low priority**
- A second 3D object for the compare page (a stacked-coins model) built with the same img2threejs pipeline.
- Per-page design overrides in `design-system/pages/`.

## 6. Creative Freedom Guidelines

- Free to explore: section composition, bento arrangements, motion choreography within the reduced-motion rules, illustration of empty states.
- Fixed: one accent, one page theme, pill controls, the double-bezel shell, sentence case, data-kind labels on every number, no single score, no hover-only features.
- Every new screen must still read as the same journey: pick → see → compare.

## 7. Stitch Loop Notes

- Seed every generation with `/DESIGN.md` sections 1-7.
- Use the prompts in `.stitch/prompts.md`; they were written with `stitch-utilities:enhance-prompt`.
