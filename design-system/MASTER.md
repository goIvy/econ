# College Value Lab — Design System (MASTER)

> **Single source of truth.** Every color, font, radius, shadow, spacing value and motion recipe in the app comes from this file, implemented as tokens in `app/globals.css` and `lib/animations.ts`. Components never hardcode them.
>
> Page-level overrides may live in `design-system/pages/<page>.md`; they may only *narrow* these rules.

**Tagline:** See what college is really worth.
**Core metaphor:** *Your future is a set of economic paths.* Paths appear everywhere: the hero's three futures, salary trajectories, break-even crossings, simulation fans, the methodology pipeline, the nav's section line.
**Register:** premium fintech × academic research × interactive data journalism. Youthful, never childish.
**Surface system:** dark-to-light hybrid. Story and simulation sections are dark (`.theme-dark`); research and data-reading sections are light. The same token names are redefined inside `.theme-dark`, so every component restyles itself.

**Provenance:** v1 ("Calibrated Instrument", light-only) was replaced by the owner's v2 brief (dark/light hybrid, #0B1020 / #6C7CFF / #36D1B4 / #A78BFA, Geist). The validated-palette method, lineage language, reduced-motion rules and checklist carry over.

---

## 1. Color tokens

### Neutrals

| Token | Light (research) | Dark | Use |
|---|---|---|---|
| `--paper` | `#F7F8FC` | `#0B1020` | Section background |
| `--surface` | `#FFFFFF` | `#11182A` | Cards, panels |
| `--surface-sunk` | `#EEF0F7` | `#0E1426` | Tracks, wells |
| `--ink` | `#141824` | `#FFFFFF` | Text, primary fills, axes |
| `--ink-2` | `#3A4152` | `rgba(255,255,255,.82)` | Secondary text |
| `--muted` | `#5D6679` | `rgba(255,255,255,.65)` | Labels, captions (the brief's `#667085` darkened slightly to pass 4.5:1 on `--surface-sunk`) |
| `--rule` / `--rule-strong` | `#E3E6EF` / `#CBD0DD` | `rgba(255,255,255,.10)` / `.20` | Borders, gridlines |
| `--on-ink` | `#FFFFFF` | `#0B1020` | Text on an `--ink` fill (primary buttons invert per theme) |
| `--glass` | `rgba(247,248,252,.72)` | `rgba(11,16,32,.62)` | Frosted nav and hero cards only |

`.theme-dark-2` swaps in the secondary dark `#11182A` as the section ground.

### Brand accents (UI, not data)

`--accent #6C7CFF` (primary accent, focus ring), `--accent-2 #36D1B4` (secondary accent), `--highlight #A78BFA`. Used for glows, active states, selection and the cursor label. Not used as chart series fills.

### Trace inks (data series), validated per theme

Paths are identified by **number tag + color + line style**, never color alone.

| Token | Path | Light | Dark | Style |
|---|---|---|---|---|
| `--trace-a` | PATH 01 | `#4F5BD5` | `#6C7CFF` | solid |
| `--trace-b` | PATH 02 | `#0E8F79` | `#16A48C` | solid |
| `--trace-d` | PATH 03 | `#7A58D0` | `#9277F2` | dotted |
| `--trace-c` | WORK (no college) | `#667085` | `rgba(255,255,255,.55)` | dashed 6/4 |
| `--trace-e` | spare / 5th | `#A86A12` | `#BE8230` | dash-dot |

Validated with the dataviz `validate_palette.js` (a, b, d, e): light on `#F7F8FC` and `#FFFFFF`, dark on `#11182A`. Lightness band, chroma floor, CVD separation, normal-vision floor and contrast all PASS. The brand's `#36D1B4` and `#A78BFA` sit above the dark lightness band, so the series use the deeper `#16A48C` / `#9277F2` and the bright versions stay UI accents. The "work from 18" path is deliberately neutral: it is the baseline every college path is measured against.

### Signals (readout states only; always with an icon or word)

| Token | Light | Dark |
|---|---|---|
| `--gain` | `#17734B` | `#42C98A` |
| `--caution` | `#7D5208` | `#F4B860` |
| `--risk` | `#C2414E` | `#EF6A75` |

### Gradients (sparingly)

Exactly two recipes: `--glow-hero` `radial-gradient(circle at 55% 40%, rgba(108,124,255,.28), transparent 45%)` behind the hero, and `--glow-2` `radial-gradient(circle at 30% 50%, rgba(54,209,180,.18), transparent 50%)` for at most one secondary dark section. Never gradient text.

---

## 2. Typography

**Geist** for everything (display weight 700–800, tight tracking). Numbers use tabular figures.

| Token | Size | Line | Tracking | Use |
|---|---|---|---|---|
| `--text-display` | `clamp(3rem, 8vw, 8.25rem)` (132px max) | 0.92 | -0.05em | Hero headline |
| `--text-section` | `clamp(2.25rem, 4.6vw, 4rem)` (64px max) | 1 | -0.045em | Homepage section questions |
| `--text-h1` | `clamp(2.4rem, 4.6vw, 4rem)` | 1 | -0.04em | Page titles |
| `--text-h2` / `--text-h3` | `clamp(1.75rem,3vw,2.6rem)` / `clamp(1.2rem,1.6vw,1.45rem)` | | | Sub-sections, card titles |
| `--text-metric` | `clamp(2.25rem, 4.2vw, 3.75rem)` | 1 | -0.04em | Large metric values |
| `--text-lede` / body / small / caption | 17–20px / 16px / 14px / 13px | | | Copy |

Section questions were reduced from 88px to 64px in the cleanup pass so each section reads as label → question → one sentence → component without a wall of type.

---

## 3. Spacing, layout, radius, elevation

- 4px spacing base (Tailwind scale). Content max-width 1200px (compare page 1320px). Section rhythm 96–160px desktop, 64–96px mobile.
- Radius: `--radius-xs 6`, `sm 10`, `md 14`, `lg 20`, `pill 999`.
- Shadows `--shadow-1/2/3`, redefined darker in `.theme-dark`.
- Breakpoints: Tailwind defaults. Verified at 375 / 768 / 1024 / 1440.

---

## 4. Component language

- **Path tag:** "PATH 01" / "01" chip in the path's trace ink. The work path reads "WORK".
- **Metric card** (`components/ui/metric-card.tsx`): label, big compact number ($84K), a badge (**DATA · ESTIMATE · SIMULATION**) and "Details". Details hold the parts, the ⓘ source card and "View calculation".
- **Only three card styles:** metric card, interactive selection card (starter card, compare column, add-college), educational card (lessons, "What this means", data kinds).
- **Confidence:** High / Moderate / Limited, gauge icon + word, with an explanation of why.
- **Sample data chip** while seeded data is live.
- **Glass:** only the fixed navbar and the hero's floating cards.
- **Buttons:** primary = `--ink` fill with `--on-ink` text, used only for continue / calculate / compare / run; secondary = outline; quiet = ghost. Primary buttons are magnetic (≤6px). No arrows in labels.
- **Cards:** `--surface`, 1px `--rule`, `--radius-md`/`lg`. No side-stripe borders; no rows of identical metric cards (a section is a narrative, not a dashboard).

---

## 5. Data visualization

- Custom SVG for paths, distributions and the map; `<canvas>` for the 1,000-futures simulation; Recharts only on app pages.
- Series: trace inks in path order with line style and direct labels. Text never wears series color.
- Axes `--muted` 11px inside plots; gridlines `--rule`.
- Every chart: visible text summary, accessible description, keyboard control where interactive, source ⓘ, and a data-kind label.
- Never fabricate precision: medians and ranges over averages; confidence shown; demo data labeled.

---

## 6. Motion

Tokens (`lib/animations.ts`): `DUR.fast 0.18s`, `standard 0.38s`, `large 0.75s`, `hero 0.95s`, `exit 0.42s`; `EASE.spring cubic-bezier(0.34,1.56,0.64,1)`, `EASE.smooth (0.16,1,0.3,1)`, `EASE.exit (0.4,0,1,1)`. Exits are faster than entrances.

- **Scroll reveal:** IntersectionObserver (framer `useInView`, once): opacity 0 + translateY 28px → in place, `DUR.large` smooth.
- **Stagger:** heading 0, description 80ms, chart 160ms, metrics 240 / 320 / 400ms.
- **Paths:** SVG stroke draw left to right; changes morph, never redraw instantly. A replaced hero path fades, shifts and compresses; the new one draws in and its timeline markers appear at 0.15 / 0.28 / 0.42 / 0.58 / 0.74s.
- **Background crossfade:** two stacked glow layers; paint the hidden one, fade it in while the other fades out (0.9s).
- **Numbers:** spring to the new value (`numberSpring`).
- **Parallax:** ≤ 30px background, ≤ 14px floating cards, fine pointers only.
- **Cursor:** on data interactions only, a small label (DRAG · EXPLORE · COMPARE · SCRUB) follows the pointer; the system cursor remains. Fine pointers only; off under reduced motion.
- **Performance:** animate transform, opacity and SVG stroke; motion values instead of React renders per frame; canvas for hundreds of lines.
- **Reduced motion:** no parallax, cursor label, magnetic pull, long scroll scenes or path choreography; keep short fades and instant chart updates.

### 6.1 Concept → metaphor

| Concept | Metaphor |
|---|---|
| Opportunity cost | Branching paths from one origin |
| Break-even | Two paths crossing, marked |
| Net price | A stack of cost blocks; aid subtracts blocks |
| Debt / compounding | Stacked blocks; a curve that bends upward |
| Salary uncertainty | A distribution with a tracer |
| Employment | 100 dots regrouping into outcomes |
| Risk | Faint futures settling into a band |
| Purchasing power | The same salary changing size by city |

Primitives live in `components/motion`; springs and variants in `lib/animations.ts`; all math in `lib/calc` (no animation code there).

---

### 6.2 Animation budget

Big moments: hero paths, the cost bar, comparison transitions, break-even and the 1,000-futures simulation. Every other section only fades up once. Text and numbers update immediately; charts animate after. No long scroll-jacked scenes.

## 7. Anti-patterns (do not ship)

- Gradient text; gradients on every section; glass anywhere but the nav and hero cards; neon glows.
- Dashboards made of metric-card rows and charts; identical card grids; side-stripe borders.
- A single "score" or better/worse verdict for a college; labeling salary outcomes good/bad.
- Unlabeled projections; numbers without a source or data-kind; color-only meaning.
- Emoji icons; hover-only functionality; motion that doesn't explain something.
- Jargon first. Say it plainly, then name the term: "What you give up" before "opportunity cost"; "Total money earned minus costs" instead of "cumulative net value".
- More than five numbers before the user asks for more.

## 8. Pre-delivery checklist

- [ ] Colors and fonts only from this file; both themes checked
- [ ] Every number: units, tabular figures, ⓘ source, data-kind
- [ ] Contrast ≥ 4.5:1 text in both themes; focus ring 2px `--accent`
- [ ] `prefers-reduced-motion` respected everywhere
- [ ] 375 / 768 / 1024 / 1440, no horizontal scroll; nothing depends on hover
- [ ] Charts: text summary, accessible description, keyboard control
- [ ] Loading, empty and error states designed
