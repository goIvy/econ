# College Value Lab — Design System (MASTER)

> **Single source of truth.** Every color, font, radius, shadow, spacing value, and motion recipe used in the app comes from this file (implemented as tokens in `app/globals.css` and `lib/animations.ts`). Nothing is hardcoded in components.
>
> Page-level overrides may live in `design-system/pages/<page>.md`; they may only *narrow* these rules, never add colors or fonts.

**Direction:** Calibrated Instrument. Each path is an experiment the visitor runs on a precision instrument.
**Register:** Light-first. Warm off-white field, navy ink, blue and teal as trace inks.
**Provenance:** Built from the owner's pinned brief (PRODUCT.md › Brand Commitments) plus the ui-ux-pro-max generator (`search.py … --design-system --persist`). The generator classified the product as "Fintech/Crypto" and proposed a dark gold/purple palette with IBM Plex. That output was **rejected** because it contradicts the pinned light-first navy/blue/teal brief, and purple is on the owner's anti-AI list. Kept from the generator: the spacing scale, contrast floor, focus/cursor rules, and the pre-delivery checklist.

---

## 1. Color tokens

All text/background pairs below were measured against `--paper` and `--surface` (WCAG 2.x). Every text color is ≥ 4.5:1 on both.

### Neutrals

| Token | Hex | Use | Contrast on paper |
|---|---|---|---|
| `--paper` | `#F8F6F2` | Page field (warm off-white) | — |
| `--surface` | `#FFFFFF` | Cards, instrument panels, inputs | — |
| `--surface-sunk` | `#F1EEE7` | Wells, table stripes, track of sliders | — |
| `--ink` | `#10213A` | Primary text, axes, primary button fill | 14.96 |
| `--ink-hover` | `#1B3152` | Primary button hover | — |
| `--on-ink` | `#FFFFFF` | Text and marks on ink or trace fills (= surface) | — |
| `--ink-2` | `#3E4C63` | Secondary text, body copy on long reads | 8.04 |
| `--muted` | `#5B677A` | Captions, units, axis labels, footnotes | 5.31 |
| `--rule` | `#DDD8CE` | Borders, dividers (non-text) | 1.32 |
| `--rule-strong` | `#C9C2B4` | Input borders, focused-card borders (non-text) | — |
| `--grid` | `rgba(16,33,58,0.055)` | The measured grid drawn on the field | — |
| `--grid-major` | `rgba(16,33,58,0.09)` | Every 5th grid line | — |

### Trace inks (paths, series)

Paths are identified by **letter tag + color + line style**, never by color alone.

| Token | Hex | Path | Line style | White text on it | On paper |
|---|---|---|---|---|---|
| `--trace-a` | `#2456C8` | Path A (blue) | solid | 6.48 | 6.00 |
| `--trace-b` | `#007F68` | Path B (teal) | solid | 4.96 | 4.59 |
| `--trace-c` | `#B04A1B` | Path C (rust) | dashed 6/4 | 5.47 | 5.06 |
| `--trace-d` | `#7A4FB5` | Path D (violet) | dotted 2/3 | 5.81 | 5.38 |
| `--trace-e` | `#7A6800` | Path E (olive) | dash-dot | 5.52 | 5.11 |

**Validated** with the dataviz skill's `validate_palette.js` on `--surface #F8F6F2` in this order: lightness band, chroma floor, adjacent CVD separation (worst ΔE 11.9), normal-vision floor, and contrast all PASS. With `--pairs all` a 5-series chart cannot separate every pair (rust↔olive under deuteranopia), which is expected past four series. That is why every path also carries its **letter tag, line style and direct end label**. Series text is never drawn in trace color. The original teal `#0A7468` and slate `#4F6378` failed the chroma floor and were replaced.

Each trace has a 10% tint for fills and selected states: `--trace-a-tint: rgba(36,86,200,0.10)` and so on.

### Signal colors (readout states only)

| Token | Hex | Meaning | Paired tint |
|---|---|---|---|
| `--gain` | `#2A7547` | Positive financial indicator (earnings, surplus, lower cost) | `#E4F0E8` |
| `--caution` | `#8A5A0B` | Caution (moderate debt burden, limited data) | `#F6ECD6` |
| `--risk` | `#B23B33` | Risk / negative pressure only (high debt-to-income, losses) | `#F6E1DE` |

Signals always ship with an icon or word ("Lower", "Caution", "Risk"), never color alone.

### Gradients (allowed in exactly three places)

1. **Hero field:** `radial-gradient(60% 50% at 78% 30%, rgba(36,86,200,0.08), transparent 70%), radial-gradient(40% 40% at 90% 70%, rgba(0,127,104,0.07), transparent 70%)` over `--paper`.
2. **Chart emphasis:** area under a trace, from `--trace-x` at 16% opacity to 0%.
3. **CTA accent:** the closing CTA band may use the hero field recipe.

**Banned:** gradient text, glassmorphism/backdrop blur on content (the sticky nav may use a solid 92% `--paper`), purple/pink AI gradients, neon glows.

---

## 2. Typography

No Inter, Roboto, Arial, IBM Plex, DM Sans, Space Grotesk, or Plus Jakarta Sans.

| Role | Family | Package | Notes |
|---|---|---|---|
| Display / headings | **Schibsted Grotesk** (variable, 400–900) | `@fontsource-variable/schibsted-grotesk` | Editorial grotesk with a sturdy, confident voice; tight tracking at large sizes |
| UI / body / numerals | **Geist** (variable) | `geist` | Precise, instrument-like; `font-variant-numeric: tabular-nums` on every number |

No monospace face. Readouts use Geist tabular numerals.

### Type scale (fluid, 1.25 ratio on mobile → 1.333 on desktop)

| Token | Size (clamp) | Line-height | Weight | Family | Tracking |
|---|---|---|---|---|---|
| `--text-display` | `clamp(2.5rem, 4.7vw, 4.25rem)` | 0.98 | 750 | Schibsted | -0.03em |
| `--text-h1` | `clamp(2.1rem, 4.2vw, 3.5rem)` | 1.04 | 720 | Schibsted | -0.025em |
| `--text-h2` | `clamp(1.7rem, 3vw, 2.5rem)` | 1.1 | 700 | Schibsted | -0.02em |
| `--text-h3` | `clamp(1.2rem, 1.6vw, 1.45rem)` | 1.25 | 650 | Schibsted | -0.01em |
| `--text-readout-xl` | `clamp(2.2rem, 4vw, 3.25rem)` | 1 | 600 | Geist tabular | -0.02em |
| `--text-readout` | `1.5rem` | 1.1 | 600 | Geist tabular | -0.01em |
| `--text-lede` | `clamp(1.08rem, 1.3vw, 1.25rem)` | 1.55 | 400 | Geist | 0 |
| `--text-body` | `1rem` (16px floor) | 1.6 | 400 | Geist | 0 |
| `--text-small` | `0.875rem` | 1.5 | 450 | Geist | 0 |
| `--text-caption` | `0.8125rem` | 1.45 | 500 | Geist | 0.005em |

Rules:
- Sentence case everywhere. **No all-caps labels, no tracked-out eyebrows.**
- Headlines are not decorated. No single accented word in a different color or italic.
- Body line length ≤ 68ch.
- Units sit next to numbers in `--muted` at 0.6em of the number size (for example, "$78,400 /yr").

---

## 3. Spacing, layout, radius, elevation

### Spacing (4px base; from the generator)

`--space-1: 4px` · `--space-2: 8px` · `--space-3: 12px` · `--space-4: 16px` · `--space-5: 24px` · `--space-6: 32px` · `--space-7: 48px` · `--space-8: 64px` · `--space-9: 96px` · `--space-10: 128px`

These map one-to-one to Tailwind's 4px spacing scale (`--space-2` = `2`, `--space-5` = `6`, `--space-9` = `24`); components use the Tailwind utilities rather than separate CSS variables.

- Section rhythm: `--space-9` desktop / `--space-8` mobile between homepage sections; more space above a heading than below it.
- Content max width `1200px`; reading width `68ch`; gutters `16px` (mobile) → `32px` (≥768) → `48px` (≥1280).
- Grid module: the field grid is **8px minor / 40px major**, and layouts snap to it.

### Breakpoints (mobile-first)

Tailwind defaults for utilities (`sm 640` · `md 768` · `lg 1024` · `xl 1280`). Every layout is verified at **375 / 768 / 1024 / 1440**, and 375 is the design floor.

### Radius

| Token | Value | Use |
|---|---|---|
| `--radius-xs` | 6px | Tags, path letters, small chips |
| `--radius-sm` | 10px | Inputs, buttons, segmented controls |
| `--radius-md` | 14px | Cards, readout panels |
| `--radius-lg` | 20px | The instrument (hero demo), modals, bottom sheets |
| `--radius-pill` | 999px | Toggles, filter pills |

Radius encodes hierarchy: the instrument is rounder than the cards inside it, and cards are rounder than their controls. Never one radius everywhere.

### Elevation (soft, navy-tinted, never grey)

| Token | Value | Use |
|---|---|---|
| `--shadow-1` | `0 1px 2px rgba(16,33,58,0.06)` | Inputs, resting cards |
| `--shadow-2` | `0 1px 2px rgba(16,33,58,0.05), 0 8px 24px -12px rgba(16,33,58,0.16)` | Hovered cards, popovers |
| `--shadow-3` | `0 2px 4px rgba(16,33,58,0.05), 0 24px 48px -20px rgba(16,33,58,0.24)` | The instrument, modals, sheets |

Resting cards use a `1px --rule` border plus `--shadow-1`. Shadow grows only on interaction or for the single most important object in a view.

---

## 4. The instrument language (component character)

These are the parts that make the world recognizable with the content removed.

- **Measured field:** `--paper` with an 8/40px grid in `--grid`/`--grid-major`, masked to fade out toward content so it never sits behind body text.
- **Axis rules:** section dividers are horizontal rules carrying fine tick marks every 8px (major tick every 40px). They are used as dividers only where the content is quantitative.
- **Path tag:** a 22px rounded square with the path letter (A–E) in white on its trace ink, followed by the path's specimen line in `--text-small`, e.g. **A** UC Berkeley · Economics · CA resident · $15k aid.
- **Readout:** label (`--text-caption`, `--muted`) above a tabular number (`--text-readout`), unit after it in `--muted`, and a footnote marker `[1]` that opens *View source*. Readouts count up from the previous value when inputs change.
- **Graduated slider:** track in `--surface-sunk` with tick marks, fill in the active trace ink, and a thumb showing its value on drag. Min/max labels always visible.
- **Segmented toggle:** used for Resident / Non-resident and Campus / Off-campus / At home. The selected segment is `--ink` fill with white text, and the indicator slides between segments.
- **Source footnote:** every metric has a superscript marker. It opens a popover (desktop) or bottom sheet (mobile) showing Source, Dataset, Year, Population, Last updated, Methodology, and a confidence badge.
- **Confidence badge:** "High confidence", "Moderate confidence", or "Limited data". Each has a three-segment gauge icon plus a word, and uses gain/caution/muted tints.
- **Demo-data label:** while seeded data is live, every readout cluster carries a quiet "Sample data" chip (`--caution` tint), and the footnote popover says "Seeded demo value — not from a live dataset."
- **Buttons:** primary = `--ink` fill, white text, `--radius-sm`, 44px min height. Secondary = `--surface` fill, 1px `--rule-strong` border, `--ink` text. Tertiary = text link with underline on hover. No arrows appended to labels.
- **Cards:** surface, 1px rule, `--radius-md`. **Banned:** side-stripe borders, identical card grids (feature sections vary layout: split, stacked, table, chart-led), and a hover lift applied to every card.

---

## 5. Data visualization

- Library: Recharts for standard charts (debt balance, tuition trend). Custom SVG for the instrument's signature charts: the cumulative-value trace chart (path draw, crosshair, break-even marker, direct end labels), the salary-percentile strip, and the tradeoff strip plot.
- Series colors: trace inks in path order A–E, plus line style (solid/solid/dashed/dotted/dash-dot) and end-of-line labels. **Never color alone.**
- Axes in `--muted`; tick labels at 11px (the one sub-caption size, allowed only inside plots), with units always in the axis title ("Cumulative net value, USD"). Plot gridlines use `--rule`; `--grid-major` belongs to the measured-field background only.
- Break-even: a vertical hairline in `--ink` at the crossing, with an annotation "≈ 8.2 years after graduation (estimate)".
- Uncertainty: a 10th–90th percentile band as a trace tint, with the median as a solid line.
- Every chart has a text summary below it (a visible sentence, not only `aria-label`), a keyboard-focusable data table fallback ("View as table"), a source footnote, and a "Projection" label when values are modeled.

---

## 6. Motion (Framer Motion only)

All variants live in `lib/animations.ts`. Every animation checks `useReducedMotion()`; under reduced motion elements render in their final state and only opacity may crossfade (≤150ms).

- **Default enter (Jakub Krehel):** `initial { opacity: 0, translateY: 8, filter: "blur(4px)" }` → `animate { opacity: 1, translateY: 0, filter: "blur(0px)" }`, `transition { type: "spring", duration: 0.45, bounce: 0 }`.
- **Scroll reveal:** `useInView(ref, { once: true, margin: "0px 0px -10% 0px" })` drives the default enter.
- **Stagger:** hero children 0.06s. Lists 0.04s, capped at 8 items (the rest enter together).
- **Micro-interactions:** buttons `whileHover { y: -1 }`, `whileTap { scale: 0.98 }`. Interactive cards `whileHover { y: -2 }` with a shadow step to `--shadow-2`. Springs use `{ type: "spring", duration: 0.3, bounce: 0 }`.
- **Enter/exit:** `AnimatePresence` wraps every conditional render (results, tabs, sheets, toasts, compare tray).
- **Readout count-up:** 600ms ease-out from the previous value to the new value.
- **Trace draw:** path length 0→1 over 900ms ease-out on first reveal. Later changes morph the data rather than redrawing.
- **Signature moment:** in the hero, three paths (A public, B private, C work from 18) leave the same point at age 18. A time head advances along them: it follows the cursor across the chart on desktop, follows scroll everywhere, and is draggable with an Age scrubber. Crossings appear only once the head passes them.
- No infinite decorative loops. Skeleton shimmer only while loading.

### 6.1 Interactive layer ("the instrument is alive")

Motion here explains an economic idea or it doesn't ship. Each concept has one visual metaphor, used everywhere:

| Concept | Metaphor | Where |
|---|---|---|
| Opportunity cost | Branching paths from one origin | Hero, two students, lessons |
| Break-even | Two traces crossing, marked by the ink crossing marker | Two students, timeline, What-If |
| Debt | Physical stack of $1,000 blocks; interest blocks hatched | Debt section |
| Earnings growth / compounding | A curve that visibly accelerates | Timeline, lessons |
| Risk / uncertainty | A spread of faint trajectories settling into a band | 1,000 Possible Futures |
| Purchasing power | The same salary changing size across a map | Purchasing-power map |
| Net price | A ledger that grows line by line, then aid slides in and subtracts | Net-cost story |

- **Primitives:** `components/motion` (AnimatedNumber, MotionText, Tilt, usePointerParallax, useScrollScene/ScrollScene, useSteppedValue). Springs live in `lib/animations.ts` (`scrubSpring`, `numberSpring`, `parallaxSpring`, `tiltSpring`, `slotSpring`, `flipTransition`, `ledgerItem`, `block`).
- **Separation:** components animate values; `lib/calc` computes them. No financial math inside a component beyond reading a precomputed series.
- **Scroll scenes:** a sticky stage inside a section 2–3 viewports tall; scroll progress drives the explanation. Always pair with a visible control (steps, age stops or a scrubber) so the scene can be operated without scrolling. Under reduced motion a scene collapses to its final state at normal height.
- **Cursor:** fine pointers only (`(hover: hover) and (pointer: fine)`). Tilt at most 2°; parallax at most 8px; heavy springs. Nothing essential depends on hover: every hover has a tap, focus or scrubber equivalent.
- **Timing:** 150–600ms for UI transitions; value springs settle in under 500ms. User-started demonstrations ("Play repayment", "Run simulation") may run 1–6s and can be stopped or skipped.
- **Performance:** animate transforms, opacity, clip widths and SVG attributes driven by motion values (no React render per frame). Hundreds of simulated lines draw on `<canvas>`, not SVG.
- **Depth:** `--shadow-2`/`--shadow-3` and the 2° tilt are the only depth tools. Blur is limited to the enter recipe (4px) and the dimmed overlay behind sheets; no glass panels.
- **Trace inks on the homepage:** A `--trace-a` public university, B `--trace-b` private university, C `--trace-c` (dashed) working from 18. The same letters mean the same paths in every section.

---

## 7. Anti-patterns (do not ship)

- Gradient text; glassmorphism by default; purple/pink gradients; neon.
- Identical card grids; side-stripe borders on cards; one radius everywhere.
- All-caps tracked labels; single-word colored accents in headlines; middle-dot meta strings as decoration; arrows appended to CTAs.
- A single "score" or "better/worse" verdict for any college.
- Unlabeled projections; numbers without a source marker; color-only meaning.
- Emoji icons (use Lucide); missing `cursor: pointer`; invisible focus.

## 8. Pre-delivery checklist

- [ ] No colors or fonts outside this file
- [ ] Every number has units, tabular numerals, and a source marker
- [ ] Projections labeled "Estimate" / "Projection"; demo data labeled "Sample data"
- [ ] Contrast ≥ 4.5:1 for text; focus ring 2px `--trace-a` with 2px offset
- [ ] `prefers-reduced-motion` respected on every animation
- [ ] Tested at 375 / 768 / 1024 / 1440; no horizontal scroll
- [ ] All images via `next/image` with `alt` and `sizes`
- [ ] Charts have text summary + table fallback + keyboard access
- [ ] Loading, empty, error, and no-data states designed
