---
name: College Value Lab
description: A calibrated instrument for measuring the financial value of one specific college path.
colors:
  paper: "#F8F6F2"
  surface: "#FFFFFF"
  surface-sunk: "#F1EEE7"
  ink: "#10213A"
  ink-hover: "#1B3152"
  on-ink: "#FFFFFF"
  ink-2: "#3E4C63"
  muted: "#5B677A"
  rule: "#DDD8CE"
  rule-strong: "#C9C2B4"
  grid: "rgba(16,33,58,0.055)"
  grid-major: "rgba(16,33,58,0.09)"
  trace-a: "#2456C8"
  trace-b: "#007F68"
  trace-c: "#B04A1B"
  trace-d: "#7A4FB5"
  trace-e: "#7A6800"
  trace-a-tint: "rgba(36,86,200,0.10)"
  trace-b-tint: "rgba(0,127,104,0.10)"
  trace-c-tint: "rgba(176,74,27,0.10)"
  trace-d-tint: "rgba(122,79,181,0.10)"
  trace-e-tint: "rgba(122,104,0,0.10)"
  gain: "#2A7547"
  gain-tint: "#E4F0E8"
  caution: "#8A5A0B"
  caution-tint: "#F6ECD6"
  risk: "#B23B33"
  risk-tint: "#F6E1DE"
typography:
  display:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.5rem, 4.7vw, 4.25rem)"
    fontWeight: 750
    lineHeight: 0.98
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.1rem, 4.2vw, 3.5rem)"
    fontWeight: 700
    lineHeight: 1.04
    letterSpacing: "-0.025em"
  headline-section:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.7rem, 3vw, 2.5rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.2rem, 1.6vw, 1.45rem)"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  readout-xl:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.2rem, 4vw, 3.25rem)"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.02em"
    fontFeature: "\"tnum\" 1"
  readout:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.01em"
    fontFeature: "\"tnum\" 1"
  lede:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.08rem, 1.3vw, 1.25rem)"
    fontWeight: 400
    lineHeight: 1.55
  body:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  body-small:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 450
    lineHeight: 1.5
  label:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.45
rounded:
  xs: "6px"
  sm: "10px"
  md: "14px"
  lg: "20px"
  pill: "999px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "24px"
  "6": "32px"
  "7": "48px"
  "8": "64px"
  "9": "96px"
  "10": "128px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-ink}"
    rounded: "{rounded.sm}"
    padding: "0 20px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.ink-hover}"
    textColor: "{colors.on-ink}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "0 20px"
    height: "44px"
  button-tertiary:
    textColor: "{colors.ink}"
    rounded: "{rounded.xs}"
  button-quiet:
    textColor: "{colors.ink-2}"
    rounded: "{rounded.sm}"
    padding: "0 20px"
    height: "44px"
  button-quiet-hover:
    backgroundColor: "{colors.surface-sunk}"
    textColor: "{colors.ink}"
  segmented-track:
    backgroundColor: "{colors.surface-sunk}"
    rounded: "{rounded.sm}"
    padding: "4px"
  segmented-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-ink}"
    rounded: "7px"
    height: "40px"
  path-tag:
    backgroundColor: "{colors.trace-a}"
    textColor: "{colors.on-ink}"
    rounded: "{rounded.xs}"
    size: "22px"
  readout-value:
    textColor: "{colors.ink}"
    typography: "{typography.readout}"
  readout-label:
    textColor: "{colors.muted}"
    typography: "{typography.label}"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "16px"
  instrument-panel:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "24px"
  chip-sample:
    backgroundColor: "{colors.caution-tint}"
    textColor: "{colors.caution}"
    rounded: "{rounded.pill}"
    padding: "2px 8px"
  badge-confidence-high:
    backgroundColor: "{colors.gain-tint}"
    textColor: "{colors.gain}"
    rounded: "{rounded.pill}"
    padding: "2px 8px"
  badge-confidence-moderate:
    backgroundColor: "{colors.caution-tint}"
    textColor: "{colors.caution}"
    rounded: "{rounded.pill}"
    padding: "2px 8px"
  badge-confidence-limited:
    backgroundColor: "{colors.surface-sunk}"
    textColor: "{colors.muted}"
    rounded: "{rounded.pill}"
    padding: "2px 8px"
  slider-track:
    backgroundColor: "{colors.surface-sunk}"
    rounded: "{rounded.pill}"
    height: "8px"
  slider-thumb:
    backgroundColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    size: "20px"
  nav:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink-2}"
    height: "64px"
---

# Design System: College Value Lab

> `design-system/MASTER.md` is the source of truth. This file records how that system landed in the shipped build (`app/globals.css`, `lib/animations.ts`, `components/**`). Where the two differ, MASTER.md governs and the difference is noted here as drift to fix, not as a new rule.

## Overview

**Creative North Star: "The Calibrated Instrument"**

Each college path is an experiment the visitor runs on a precision instrument. The page is not a brochure that ranks schools: it is a warm off-white bench ruled by a faint measured grid, with navy ink for structure and a small set of "trace inks" that identify each path (A through E) the way a plotter identifies its pens. Numbers are read off the instrument as readouts, in tabular Geist numerals with muted units and a footnote marker that answers "where did this come from?"

The density is that of a lab instrument, not a dashboard: a few large, rounded panels hold the controls, readouts and chart for one experiment, and everything around them stays quiet. Headlines in Schibsted Grotesk are confident, tightly set and undecorated. Motion is calibrated rather than decorative: readouts count up from their previous value, traces draw once and then morph, and the break-even marker settles in last.

The build is light-first and explicitly rejects the fintech default (dark gold and purple, headline plus dashboard screenshot plus three feature cards), gradient text, glassmorphism, and any single "score" or verdict for a college.

**Key Characteristics:**
- Warm paper field (#F8F6F2) with an 8px/40px measured grid behind instruments only.
- Navy ink (#10213A) for text, axes and primary fills; blue and teal trace inks for Path A and Path B.
- Every path encoded three ways: letter tag, trace color, and line style.
- Readouts: caption label, tabular number, muted unit, source footnote marker.
- Tick-marked axis rules divide sections.
- Radius encodes hierarchy: instrument (20px) > card (14px) > control (10px) > tag (6px).
- Soft navy-tinted shadows; no grey shadows, no glows.

## Colors

A warm, paper-and-ink palette with five calibrated trace inks and three signal colors that only ever appear in readout states.

### Primary
- **Chart-Room Navy** (#10213A, `--ink`): primary text, axes, the zero line, the break-even hairline, primary button fill and the selected segment of every segmented toggle. Contrast 14.96:1 on paper.
- **Deep Navy Hover** (#1B3152, `--ink-hover`): primary button hover only.

### Secondary (trace inks)
- **Path Blue** (#2456C8, `--trace-a`): Path A, solid line. Also the system focus ring, text caret and selection tint.
- **Path Teal** (#007F68, `--trace-b`): Path B, solid line.
- **Path Rust** (#B04A1B, `--trace-c`): Path C, dashed 6/4.
- **Path Violet** (#7A4FB5, `--trace-d`): Path D, dotted 2/3.
- **Path Olive** (#7A6800, `--trace-e`): Path E, dash-dot 8/3/2/3.
- Each trace has a 10% tint (`--trace-x-tint`) for fills, selected states and uncertainty bands.

### Tertiary (signals)
- **Ledger Green** (#2A7547, tint #E4F0E8, `--gain`): positive financial indicators and "High confidence".
- **Muted Amber** (#8A5A0B, tint #F6ECD6, `--caution`): caution, "Moderate confidence", and the "Sample data" chip.
- **Soft Brick** (#B23B33, tint #F6E1DE, `--risk`): risk and negative pressure only.

### Neutral
- **Warm Paper** (#F8F6F2, `--paper`): the page field and the sticky nav (at 92% opacity).
- **Clean Surface** (#FFFFFF, `--surface`): cards, instrument panels, popovers, inputs.
- **Sunk Well** (#F1EEE7, `--surface-sunk`): slider tracks, segmented-toggle tracks, table headers, quiet hovers, notes.
- **Slate Ink** (#3E4C63, `--ink-2`): secondary text, ledes, inactive nav links. 8.04:1 on paper.
- **Instrument Grey** (#5B677A, `--muted`): captions, units, axis labels, min/max labels. 5.31:1 on paper.
- **Hairline** (#DDD8CE, `--rule`): borders, dividers, chart gridlines, minor ticks.
- **Strong Hairline** (#C9C2B4, `--rule-strong`): input and secondary-button borders, major ticks, scrollbar thumb.
- **Grid** (`rgba(16,33,58,0.055)` / major `rgba(16,33,58,0.09)`): the measured field only.

### Named Rules
**The Three Encodings Rule.** A path is never identified by color alone. It always carries its letter tag, its trace color and its line style (solid, solid, dashed, dotted, dash-dot), plus a direct end label in charts. Series text is set in ink, never in trace color.

**The Signals Are Readouts Rule.** Gain, caution and risk appear only in readout states, badges and chips, always paired with a word or icon ("High confidence", "Sample data"). They never decorate layout.

**The Three Gradients Rule.** Gradients appear in exactly three places: the hero field wash (two radial washes of trace A at 8% and trace B at 7%), chart emphasis under a trace, and the closing CTA band. Nothing else.

## Typography

**Display Font:** Schibsted Grotesk (variable, self-hosted via `next/font/local`, falling back to ui-sans-serif, system-ui)
**Body Font:** Geist Sans (variable, via the `geist` package, same fallback)
**Label/Mono Font:** none. Readouts use Geist with tabular numerals (`.tabular`, `"tnum" 1`).

**Character:** A sturdy editorial grotesk with tight tracking at size, paired with a precise, instrument-like sans whose tabular figures keep animating numbers from jittering.

### Hierarchy
- **Display** (750, `clamp(2.5rem, 4.7vw, 4.25rem)`, 0.98, -0.03em): the homepage hero headline only.
- **Headline** (700, `clamp(2.1rem, 4.2vw, 3.5rem)`, 1.04, -0.025em): page titles (college detail, simulator, onboarding).
- **Section headline** (700, `clamp(1.7rem, 3vw, 2.5rem)`, 1.1, -0.02em): section headings, capped at 44rem wide with a lede below.
- **Title** (600, `clamp(1.2rem, 1.6vw, 1.45rem)`, 1.25, -0.01em): panel and card titles.
- **Readout XL / Readout** (600 Geist tabular, `clamp(2.2rem, 4vw, 3.25rem)` at 1 / `1.5rem` at 1.1): headline metrics and standard readouts.
- **Lede** (400, `clamp(1.08rem, 1.3vw, 1.25rem)`, 1.55): section introductions in `--ink-2`.
- **Body** (400, 1rem, 1.6): running text, max 68ch (`.measure`).
- **Small** (0.875rem, 1.5): nav links, chart summaries, table cells, buttons at `sm`.
- **Label** (500, 0.8125rem, 1.45): readout labels, control labels, legends, axis titles, in `--muted`.

Headlines are set at 720 (`font-[720]`) and titles at 650 (`font-[650]`), as MASTER.md specifies; the variable Schibsted file carries both weights.

### Named Rules
**The Sentence Case Rule.** Sentence case everywhere. No all-caps labels, no tracked-out eyebrows, and no headline with a single word set in another color or in italic.

**The Muted Unit Rule.** A unit sits beside its number in `--muted`, smaller and lighter (for example "$78,400 /yr"), and the number is always tabular.

## Layout

Mobile-first on Tailwind's default breakpoints (sm 640, md 768, lg 1024, xl 1280), verified at 375 / 768 / 1024 / 1440 with 375 as the floor and no horizontal page scroll. Content sits in a 1200px container with gutters of 16px (mobile), 32px (≥768) and 48px (≥1280). Spacing follows a 4px base (`--space-1` 4px through `--space-10` 128px), applied through Tailwind's 4px spacing utilities.

Sections are built by `Section`: an axis rule at the top of the container, then generous space above the heading and less below (the build uses 64px/80px below the rule and 80px/112px of bottom padding, mobile/desktop). Feature sections vary their composition (split 7/5 or 8/4 columns, stacked, table-led, chart-led) rather than repeating a card grid. The measured field (8px minor / 40px major) sits only behind instruments (the hero demo, the college metric header, onboarding) and is masked with `.field-fade` so it never sits behind body text. The sticky nav is 64px (`--nav-h`); anchor targets scroll to 16px below it.

## Elevation & Depth

Depth is soft, navy-tinted and hierarchical. Resting surfaces are separated by a 1px `--rule` border plus the faintest shadow; stronger shadows mark the one object that matters in a view, floating layers, or interaction.

### Shadow Vocabulary
- **Resting** (`box-shadow: 0 1px 2px rgba(16,33,58,0.06)`, `--shadow-1`): inputs, resting cards, buttons, the selected segment, the nav once scrolled.
- **Raised** (`box-shadow: 0 1px 2px rgba(16,33,58,0.05), 0 8px 24px -12px rgba(16,33,58,0.16)`, `--shadow-2`): hovered cards, chart tooltips, the slider thumb.
- **Lifted** (`box-shadow: 0 2px 4px rgba(16,33,58,0.05), 0 24px 48px -20px rgba(16,33,58,0.24)`, `--shadow-3`): the hero instrument, source popovers, dialogs and bottom sheets.

### Named Rules
**The Earned Shadow Rule.** Shadow grows only on interaction or for the single most important object in a view. Shadows are always navy-tinted, never grey, and never glow.

## Shapes

Radius encodes hierarchy: the instrument is rounder than the cards inside it, and cards are rounder than their controls. Tags and path letters use 6px (`--radius-xs`); buttons, inputs and segmented tracks 10px (`--radius-sm`); cards and popovers 14px (`--radius-md`); the instrument, modals and bottom sheets 20px (`--radius-lg`); toggles, chips, badges and slider tracks are fully round. Inner segments sit at 7px so they nest inside the 10px track with 4px of padding (a concentric radius, 10 − 3).

The recurring geometry is the ruler: the axis rule is a 1px `--rule-strong` line carrying 1px ticks every 8px (5px tall, `--rule`) and every 40px (9px tall, `--rule-strong`). The same tick language appears on slider tracks and chart axes. Cards never carry side-stripe borders.

## Components

### Buttons
Confident, compact, and quiet about it.
- **Shape:** gently rounded (10px); tertiary links use 6px for their focus ring.
- **Primary:** `--ink` fill, `--on-ink` text, Geist 600, `--shadow-1`; 44px tall with 20px side padding at `md`, 48px/24px at `lg`, 44px/12px at `sm` on touch widths, 36px from `md` up.
- **Hover / Focus:** fill steps to `--ink-hover`; primary and secondary lift 1px (`whileHover { y: -1 }`), all variants press to 0.98 scale, both on a 0.3s spring with no bounce. Focus is the global 2px `--trace-a` outline at 2px offset.
- **Secondary:** `--surface` fill, 1px `--rule-strong` border (darkening toward ink on hover), `--ink` text.
- **Tertiary:** an ink text link that underlines on hover, offset 4px, in `--rule-strong`.
- **Quiet:** `--ink-2` text that takes a `--surface-sunk` background and ink text on hover; for icon and utility actions.
- No arrows are appended to labels.

### Chips and Badges
- **Sample data chip:** fully round, `--caution-tint` background, `--caution` text, 0.75rem Geist 600, a 6px dot before the words. Present on every readout cluster while data is seeded.
- **Confidence badge:** the same pill, with a three-bar rising gauge (3px bars, filled 3/2/1) and the words "High confidence" (gain), "Moderate confidence" (caution) or "Limited data" (sunk and muted).

### Cards / Containers
- **Corner Style:** 14px for cards, 20px for instrument panels that hold controls, readouts and charts.
- **Background:** `--surface` on the paper field.
- **Shadow Strategy:** `--shadow-1` at rest; interactive cards transition border color and shadow on hover rather than lifting.
- **Border:** 1px `--rule`.
- **Internal Padding:** 16px on mobile, 20–24px from `sm` upward.

### Inputs / Fields
- **Segmented toggle:** a `--surface-sunk` track with a 1px `--rule` border, 10px radius and 4px padding. The selected segment is an ink-filled 7px pill with white text that slides between segments (shared `layoutId`, 0.3s spring). Segments are at least 40px tall and may carry a tabular hint line (for example, tuition). Radio-group semantics: the arrow keys move the selection.
- **Graduated slider:** an 8px round track in `--surface-sunk` with 1px `--rule-strong` ticks, a fill in the active path's trace ink (or ink), and a 20px ink thumb with a 2px white ring and `--shadow-2`. While dragging, a small ink value flag pops above the thumb. The label (caption, muted) and the current value (tabular, ink) sit above the track; min and max labels are always visible below it.
- **Combobox:** a searchable single-select for colleges and majors, opening a popover list with type-to-filter and arrow-key navigation.
- **Focus:** the 2px `--trace-a` outline at 2px offset everywhere; the text caret is `--trace-a`.

### Navigation
A 64px sticky header on 92% `--paper`, borderless at the top of the page and gaining a `--rule` border and `--shadow-1` after 8px of scroll. Links are 0.875rem Geist 500 in `--ink-2`, turning ink on hover; the active link is ink with a 2px ink underline that slides between links. Below 1280px the links collapse into a full-width sheet of 1.35rem Schibsted links that stagger in (0.04s), with "Sign in" and "Get started" paired at the bottom. A skip link comes first.

### Readout (signature)
The instrument's unit of truth. It is a `dt`/`dd` pair: a caption label in `--muted` (with an optional info tip), then a tabular Geist 600 number in ink at `readout` (1.5rem) or `readout-xl`, a muted unit beside it, and a source footnote marker. The number counts up from its previous value over 600ms with an exponential ease-out. Modeled values carry a small "Estimate" line; a missing value reads "No data" in muted small text.

### Source footnote (signature)
A small bordered tabular marker (1px `--rule-strong`, 4px radius, raised slightly from the baseline) that says "View source for [metric]". On desktop it opens a 22rem `--surface` popover (14px radius, `--shadow-3`); on phones it opens a bottom sheet (20px top radius) with a grab handle. Both show the confidence badge, the sample-data chip, then Source, Dataset, Year, Population, Last updated, Sample size and Methodology, with a link to "How this is calculated".

### Path tag and trace chart (signature)
- **Path tag:** a 22px (or 18px) rounded square in its trace ink with the white letter A–E in Geist 700.
- **Trace chart:** gridlines in `--rule` with a stronger ink zero line, tabular muted axis labels, lines in trace ink with their dash pattern, and direct end labels (ink name plus muted value). The break-even point is an ink hairline and ringed marker with an ink annotation card. Hovering shows an ink crosshair and a `--surface` tooltip. Every chart has a visible text summary and a "View as table" toggle that reveals a scrollable tabular data table.

### Motion
All variants live in `lib/animations.ts`, and every one falls back under `prefers-reduced-motion` to its final state with at most a 150ms opacity crossfade.
- **Enter:** opacity 0→1, 8px rise, 4px→0 blur, spring 0.45s / bounce 0; scroll-revealed once at −10% bottom margin.
- **Stagger:** hero children 0.06s; lists 0.04s, capped at 8 items.
- **Micro:** spring 0.3s / bounce 0.
- **Trace draw:** pathLength 0→1 over 900ms `cubic-bezier(0.16, 1, 0.3, 1)`, staggered 0.12s per path; later data changes morph `d` over 600ms.
- **Break-even marker:** settles in last (spring 0.5s, bounce 0.15, 0.9s delay).
- **Popover:** scale 0.97→1 with a 4px drop and 2px blur. **Sheet:** slides up from 100% on a 0.4s spring.

## Do's and Don'ts

### Do:
- **Do** take every color, font, radius and shadow from the tokens in `app/globals.css`, which mirror `design-system/MASTER.md`.
- **Do** give every number units, tabular numerals and a source footnote marker; label projections "Estimate" and seeded values "Sample data".
- **Do** identify each path with its letter tag, trace ink and line style together.
- **Do** keep text contrast at 4.5:1 or higher and use the 2px `--trace-a` focus ring at 2px offset.
- **Do** divide quantitative sections with the tick-marked axis rule, and put the measured grid only behind instruments.
- **Do** step radius down as you nest: 20px instrument, 14px card, 10px control, 6px tag.
- **Do** give every chart a visible text summary, a "View as table" fallback and keyboard access.
- **Do** import motion from `lib/animations.ts` and respect reduced motion.

### Don't:
- **Don't** use gradient text, glassmorphism or backdrop blur on content, purple or pink gradients, or neon glows.
- **Don't** use Inter, Roboto, Arial, IBM Plex, DM Sans, Space Grotesk or Plus Jakarta Sans.
- **Don't** use all-caps labels, tracked-out eyebrows, or a single accented word in a headline.
- **Don't** build identical card grids, put side-stripe borders on cards, or use one radius everywhere.
- **Don't** reduce a college to a single score or a "better/worse" verdict.
- **Don't** convey meaning with color alone, or set series text in trace color.
- **Don't** append arrows to button labels or use emoji as icons (use Lucide).
- **Don't** run infinite decorative loops; shimmer is only for loading.
