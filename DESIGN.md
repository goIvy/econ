# Design System: College Value Lab (v2)

> `design-system/MASTER.md` is the source of truth for every token, recipe and rule. This file is a short record of the shipped identity. Where the two differ, MASTER.md governs.

## Overview

**Tagline:** See what college is really worth.
**Core metaphor:** your future is a set of economic paths. Paths show up everywhere: the hero's three futures, salary trajectories, break-even crossings, the 1,000-futures fan, the methodology pipeline.

The register is premium fintech × academic research × interactive data journalism. The page uses a **dark-to-light hybrid**: story and simulation chapters sit on deep navy (`#0B1020` / `#11182A`), research and data-reading chapters on a cool light ground (`#F7F8FC`). Both themes redefine the same CSS variables (`.theme-dark`, `.theme-dark-2`), so every component restyles itself.

v1 ("Calibrated Instrument", warm paper, Schibsted Grotesk, light only) was replaced by this system at the owner's request.

## Colors

| Role | Values |
|---|---|
| Grounds | `#0B1020`, `#11182A` (dark) · `#F7F8FC`, `#FFFFFF` (light) |
| Brand accents (UI only) | `#6C7CFF` primary, `#36D1B4` secondary, `#A78BFA` highlight |
| Path inks (data) | PATH 01 blue solid, PATH 02 teal solid, PATH 03 violet dotted, WORK neutral dashed. Validated per theme with the dataviz palette checker |
| Signals (with a word or icon) | gain `#42C98A`, caution `#F4B860`, risk `#EF6A75` on dark; darker equivalents on light for 4.5:1 contrast |

Chart series use slightly deeper teal and violet than the brand accents so they pass the dark-mode lightness check; the bright versions stay UI accents.

## Typography

Geist for everything, with tabular figures for numbers. Display 700–800 with tight tracking: the hero headline up to ~92px, section questions up to 64px (36px on phones).

## Simplicity rules (cleanup pass)

- **One journey:** college → major → residency → optional aid → result → compare → explore deeper. The starter card is the clearest element on the page.
- **Progressive disclosure:** level 1 a simple answer (five numbers + "What this means" + the next two actions), level 2 "Details", level 3 "View calculation". Assumptions and methodology sit in one "Advanced analysis" panel.
- **One chart per idea:** the payoff timeline is the only "college vs. working from 18" chart on the homepage.
- **No dead ends:** placeholder pages were removed; every control changes something you can see.
- **Every section:** small label, large question, one sentence, one interactive component.
- **Plain words first**, the economics term second ("What you give up", then "Economists call this opportunity cost").
- **Overview numbers are compact** ($84K, 7.4 yrs, 91%); full values appear in details.
- **Badges:** DATA, ESTIMATE, SIMULATION.
- **Three card styles only:** metric card, interactive selection card, educational card. **Buttons:** primary (continue / calculate / compare / run), secondary, quiet (ghost).
- **Animation budget:** the big moments are the hero paths, cost bar, comparison transitions, the payoff timeline and the simulation; everything else only fades up. Text updates immediately; charts animate after.

## Components and surfaces

- Fixed glass navbar: Explore, Compare, Learn, Research; a Saved icon; one primary action, **Start comparing**. A thin progress line shows how far down the page you are; the bar switches to the dark or light treatment of the section underneath. Deep pages use breadcrumbs (Explore / UC Berkeley / Economics).
- Glass is used only for the navbar and the hero's floating cards.
- Every metric shows a label, a compact tabular value, a badge (DATA, ESTIMATE, SIMULATION) and, in its details, an ⓘ source card.
- Primary buttons are ink-filled and magnetic (≤6px). Cards are `--surface` with a 1px rule; no side stripes and no rows of identical metric cards.

## Motion

Tokens live in `lib/animations.ts`: fast 0.18s, standard 0.38s, large 0.75s, hero 0.95s; smooth, spring and exit easings. Scroll reveals rise 28px and stagger. Paths draw and morph instead of redrawing; numbers spring to new values; a cursor label (DRAG, EXPLORE, COMPARE, SCRUB) appears on data interactions for fine pointers only. College pages switch with View Transitions. Under `prefers-reduced-motion`, parallax, cursor labels, magnetic pull, long scroll scenes and path choreography turn off, and charts update instantly.

## Do / Don't

**Do:** label sample data; show ranges and medians; give every chart a text summary, an accessible description and keyboard control; keep everything usable without hover.

**Don't:** gradient text, a single score or verdict for a college, good/bad labels on salaries, unlabeled projections, color-only meaning, emoji icons, motion that doesn't explain something.
