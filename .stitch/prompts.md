# Stitch prompts

Enhanced with `stitch-utilities:enhance-prompt`, using `/DESIGN.md` as the design system. Paste one prompt per Stitch generation.

---

## 1. Homepage (desktop)

A calm, premium decision tool that shows a student what a college and major are really worth, with a warm 3D graduation cap and an asymmetric hero.

**DESIGN SYSTEM (REQUIRED):**
- Platform: Web, desktop-first, responsive to 390px
- Theme: Light, gallery-airy, cool zinc with one warm accent, fine film grain
- Background: Zinc Canvas (#F4F4F5)
- Surface: Near-White Surface (#FCFCFC) for cards and bento tiles
- Primary Accent: Ember (#D9622A) for primary buttons, active states and focus rings
- Accent text: Ember Ink (#A8431A)
- Text Primary: Graphite Ink (#16171B); Text Secondary: Slate (#3F4148)
- Font: Geist (display 600-650, tight tracking), Geist Mono for indices and metadata
- Buttons: fully pill-shaped; primary CTAs carry a trailing arrow inside its own small circle (button-in-button)
- Containers: double-bezel shells (outer 28px radius with 6px padding and a hairline ring, inner 22px radius core)

**Page Structure:**
1. **Floating nav island:** glass pill detached from the top edge; logo left, Explore / Compare / Learn / Research centred, saved icon and "Start comparing" pill right.
2. **Hero (asymmetric split):** left, a three-line headline "See what college is / really worth." with the last phrase in Ember Ink, one sentence, "Start comparing" and "See an example" pills. Right, a large matte-black graduation cap with an orange tassel floating over a soft contact shadow.
3. **Build your college path:** left column pinned with three numbered steps (Pick, See, Compare); right, a double-bezel form with College and Major comboboxes, an In-state / Out-of-state pill toggle, an optional grants field and a full-width "See my college path" button.
4. **Results bento (01):** college name large; one 2x2 lead tile "Net cost $102K" with a soft ember glow, four single tiles (Expected debt, Early-career pay, Employment outlook, Break-even). Each tile has a DATA or ESTIMATE badge and a small "+" circle.
5. **What this means:** a double-bezel card with two sentences in large text and "Compare another college" / "See when it pays off" buttons.
6. **Chapters 02-07:** question headlines with a mono index (02 Compare, 03 Cost, 04 Payoff, 05 Possible futures, 06 Learn, 07 Data), each followed by one sentence and one interactive block.
7. **Final call to action:** an inverted graphite card inside a bezel with an ember glow, headline "See what your college is really worth." and a "Start comparing" pill.
8. **Footer:** three short link columns, a "Sample data" note and a Light / Dark / System switch.

---

## 2. Possible futures (simulation section)

Add a telemetry-style simulation section that runs 1,000 possible futures for the student's path.

**Specific changes:**
- Location: homepage section 05, "There isn't just one possible future."
- Chart: a double-bezel panel. Top strip in Geist Mono uppercase with a dashed bottom rule: "SIM/UC BERKELEY ECONOMICS · RUNS 1,000 · AGES 18-40 · STATUS READY".
- Centre: a pill "Run simulation" button over a faint single projected line and a dashed "Work from 18" baseline.
- After running: an ember fan of 1,000 thin lines settles into two translucent bands (middle 50%, 80%), a median line and a small sideways histogram labelled "AT 40".
- Right column readout: three numbered rows (01 Typical outcome by 40, 02 Likely range, 03 Pays off within 10 years) with mono uppercase labels, large tabular numbers and dashed dividers.
- A hairline "What changes in each future?" disclosure with a rotating "+".

**Context:** This is a targeted section. Keep the rest of the page unchanged. The telemetry voice is used only here.

---

## 3. College page (dark)

A single-college view that lets a student browse colleges with the arrow keys and scrub a payoff timeline.

**DESIGN SYSTEM (REQUIRED):**
- Platform: Web, desktop-first
- Theme: Dark, same system in its dark steps
- Background: Night Canvas (#0E0F12); Surface: Night Surface (#17181C)
- Primary Accent: Ember (#E06A2B); accent text Ember Ink (#F08A55)
- Text Primary: #F2F2F3

**Page Structure:**
1. **Top row:** breadcrumb "Explore / Arizona State / Economics"; right, two `<kbd>` keys "← →" with "to browse", then previous and next college pills.
2. **Left:** college name in large sentence case, the major in Ember Ink, one line of place and type, then five compact metrics (net cost, debt, pay, employment, break-even) each with a small DATA or ESTIMATE badge.
3. **Right:** a panel with the "Total money earned minus costs, vs. working from 18" line chart, a dashed baseline, a break-even marker and an age slider.
4. **Below:** a major combobox, a residency pill toggle and tabs (Overview, Cost, Career outcomes, Majors, Research).
