# Design System: College Value Lab (v4, cinematic)

> Written in the Stitch semantic format (`stitch-utilities:taste-design` / `design-md`) so it can seed Google Stitch screens. `design-system/MASTER.md` holds the token-level engineering rules; `app/globals.css` is the implementation. `.stitch/SITE.md` is the site constitution and `.stitch/prompts.md` holds ready-to-use Stitch prompts.
>
> Design read: **an overhaul of a consumer decision tool.** Dials: variance 7, motion 7, density 4.

## 0. v5 update: light, with ThreeUI moments

The owner found the dark default confusing, so the site is **light only** (no theme switch). The cinematic serif typography, white-on-ink pills and inset rounded stages stay. Five ThreeUI components (MIT, `@designcodeio/threeui` 1.2.0) carry the "wow" moments, each fitted to the site:

- **Hero: Gallery** (Three.js r149, pinned as `three149`). Sixteen curved panels on a vertical rail over the paper grid. The bundled photographs are replaced with plates drawn from real college paths, and the inside faces use a mirrored texture so plate type never reads backwards (`features/threeui/college-gallery.tsx`).
- **"Why this exists": SylvaLivingWorldScene** behind a frosted panel. Its authored font is served from `/inner-green-assets/` with a CORS header, because the scene runs in an opaque-origin iframe.
- **"Every college is a path": TextPathStudies globe study** in light mode, with the continents written in our own phrase (`features/threeui/college-globe.tsx`; the adapter is vendored under `features/threeui/vendor/`).
- **"Play my future": LiquidMetalButton** (play variant, 88px) in the payoff chart.
- **Sign-off: SemanticBloom** drawing "College Value Lab" above the footer.

Added in v5.1:

- **The Elite Shelf** (`/shelf`): CompleteShelfLandingPage with its configured typography (Iowan Old Style / Inter, primary #4689c8). The framed page is built from the authored "Working Volumes" source by `scripts/build-college-shelf.mjs`: seven elite universities replace the seven tools, and choosing a volume posts its college id to the parent, which shows that college's figures and links to its full numbers and to Compare.
- **Growth section**: the generative tree beside three levers (plant for less, keep the roots light, grow faster), each jumping to the part of the page that shows it for your own path.
- **Possible futures**: the PredictiveArcCanvas tile beside the question.
- **Opening intro**: TextAnimationCollection's `threeui-intro` beat (vendored adapter) assembling "Value Lab" with our mark, once per session, skippable, never under reduced motion.

Not used: OrbGallery, AshenPress and GetStartedButton (not in the published package or the public repo), GalleryHeading (its headline is fixed to another product's copy), Sketchbook, TempleNight, Landscape, WarpField and AnimatedTopDock (off-brand for a light college site, or duplicating the nav).

## 0b. v4 update: cinematic editorial

Restyled after an owner-supplied reference reel of cinematic hero templates. What changed from v3 (everything below still applies unless it says otherwise):

- **Dark by default.** Near-black canvas (#0A0A0C), surface #141417. Light and System remain in the footer switch.
- **Editorial serif titles.** Page and section titles are Instrument Serif (one weight, no faux bold), with one italic idea per title shown in a soft ink-to-ember gradient ("See what college *is really worth*", "Four choices. *No guesswork.*"). UI, numbers and body stay in Geist.
- **Inset cinematic stages.** The hero, the "why this exists" statement and the final call to action sit in rounded (36px) inset canvases with a warm horizon glow.
- **Hero:** a "New" badge pill, a centred serif headline that resolves out of a blur word by word, a pill college search with a round white arrow button (it opens the path builder with the college filled in and focuses Major), and the 3D cap inside three orbiting rings of glowing particles.
- **Primary buttons** are bright ink pills (white on dark) with the arrow in its own circle. Ember stays the accent for focus rings, italics, data and progress.
- **Statement:** a frosted glass panel over drifting light and a fan of decorative future-curves; the sentence lights up word by word as it scrolls.
- **Popular paths gallery:** filter pills (All / Public / Private) over cards with generated light-trail art and the college name set large in serif; "Try this path" loads the real numbers.
- Anti-patterns updated: a centred hero and gradient text on the one italic idea are now allowed (owner's reference); everything else in section 7 stands.

## 1. Visual Theme & Atmosphere

A calm, gallery-airy instrument for a big personal decision. The page feels like a well-lit architecture studio with a single ember of warmth. Cool zinc surfaces, one burnt-orange accent, confident asymmetric layouts and a tactile 3D graduation cap that tilts with the pointer and tosses when tapped. Motion is fluid and weighty (spring and custom cubic-bezier curves), never bouncy or decorative. A fine film grain sits over everything so nothing reads as sterile flat vector.

There is **one page theme** that follows the system setting, with a Light / Dark / System switch in the footer. Sections never flip to a different theme mid-page. Depth comes from nested "double-bezel" shells, hairline rings and tinted diffused shadows, not from heavy borders.

The single simulation section ("There isn't just one possible future") borrows a restrained **telemetry** voice: mono uppercase readouts, dashed rules, numbered 01/02/03 stats. That language stays inside the simulation and is not used as decoration elsewhere.

## 2. Color Palette & Roles

**Light**
- **Zinc Canvas** (#F4F4F5): page background
- **Near-White Surface** (#FCFCFC): cards, bento tiles, bezel cores
- **Sunken Zinc** (#EBEBED): wells, pressed states, inactive tracks
- **Graphite Ink** (#16171B): primary text, the inverted final-CTA card
- **Slate Secondary** (#3F4148): body copy and descriptions
- **Muted Steel** (#5D6068): metadata, captions, axis labels
- **Whisper Rule** (rgba(22,23,27,0.09)): 1px structural hairlines and rings
- **Ember Accent** (#D9622A): primary buttons, active states, focus rings, progress line
- **Ember Ink** (#A8431A): accent-coloured text (AA on canvas and surface)

**Dark** (selected steps, not an automatic inversion)
- **Night Canvas** (#0E0F12), **Night Surface** (#17181C), **Graphite Ink** (#F2F2F3), **Ember Accent** (#E06A2B), **Ember Ink** (#F08A55)

**Data inks** (chart series only, validated with the dataviz palette checker for both themes, assigned in fixed order and never cycled)
- Path 01 Ember (#D4581F / dark #E06A2B), Path 02 Cobalt (#3567C9 / #5585E0), Path 03 Pine (#1A8A6E / #1F9C79, dotted), Work-from-18 Neutral (#6B6E76, dashed)

**Signals** (always paired with a word): Gain (#17734B), Caution (#7D5208), Risk (#B8323F)

Only one UI accent. Saturation stays below 80%. No purple or blue "AI gradient", no neon glows, no pure black.

## 3. Typography Rules

- **Display:** Geist, weight 600-650, track-tight (-0.05em at hero sizes), leading 0.95. The hero headline runs to ~94px on three lines ("See what college is / really worth."), with the last phrase in Ember Ink.
- **Body:** Geist 400-500, relaxed 1.5 leading, max ~65 characters per line, Slate Secondary.
- **Mono:** Geist Mono for section indices (01-07), metadata and the simulation telemetry. Numbers everywhere use tabular figures.
- **Case:** sentence case for every heading and button. Small uppercase appears only in mono labels.
- **Banned:** Inter, system-font defaults, serif display faces, all-caps headlines, gradient text.

## 4. Component Stylings

- **Navigation:** a floating glass island detached from the top edge (12-16px gap), fully pill-shaped, with a hairline ring and inner highlight. Active page is a sliding pill. On the homepage a 1px ember progress line runs along its bottom edge. On phones two lines morph into an X and open a full-screen frosted sheet whose links rise in one by one.
- **Buttons:** always pill-shaped. Primary is an Ember fill with graphite text, an inner top highlight and a soft ember-tinted shadow. Key calls to action use **button-in-button**: the trailing arrow sits in its own small circle that nudges up-right on hover. Secondary is a surface pill with a hairline ring. Pressing scales to 0.98.
- **Double-bezel shells:** major containers (starter form, results bento, "What this means", simulation chart, final call to action) are an outer shell (28px radius, 6px padding, faint tinted fill, hairline ring) holding an inner core (22px radius, surface fill, inner highlight, diffused shadow).
- **Bento results:** one large lead tile (net cost, 2x2) and four single tiles packed with a 6px gap inside one shell. Each tile is a disclosure button: a small "+" circle rotates to "x" when open.
- **Inputs:** label above, helper or error below, 14px radius, accent focus ring (4px soft ember halo). Comboboxes are searchable popovers.
- **Disclosures:** minimalist hairline rows (top and bottom rule, no card), a "+" in a ring that rotates 45 degrees when open.
- **Data-kind badges:** tiny outlined pills, DATA / ESTIMATE / SIMULATION, next to every number. A "Sample data" chip marks every figure until live data is connected.
- **Keyboard hints:** real `<kbd>` keys (hairline ring plus a 1px bottom edge) beside the college browser arrows.
- **Loaders:** skeletons shaped like the final layout; a small inline spinner only inside a pressed button.

## 5. Layout Principles

- Max width 1200px with 16px (phone) to 32px gutters. CSS grid, never flexbox percentage maths.
- Hero is an **asymmetric split**: copy left (1.1fr), the 3D cap right (0.9fr). Not centred.
- The "Build your college path" section pins its heading and three numbered steps on the left while the starter form scrolls on the right.
- Each homepage chapter is a question headline with a mono index (01-07), one sentence, then one interactive component. Section padding 64px (phone) to 96px.
- No three-equal-column feature rows: lessons use a 3+2 asymmetric grid, the data legend is a hairline table, results are a bento.
- Everything collapses to one column below 768px; the sticky summary becomes a floating glass card at the bottom of the screen.

## 6. Motion & Interaction

- Easing: `cubic-bezier(0.32, 0.72, 0, 1)` for UI, 280ms default. Exits are faster than entrances.
- Entrances: headline, sentence and CTA rise in with blur-to-sharp (28px, 0.9s, 90ms stagger).
- **GSAP ScrollTrigger (two uses only):** (1) the hero scrubs back (cap scales to 0.86 and fades) as the path builder takes over; (2) the payoff sentence lights up word by word as it scrolls through the viewport.
- The 3D cap (Three.js, procedural, built through the img2threejs pipeline): pointer tilt on mouse, idle float, damped tassel sway, one entrance toss, tap to toss again. It pauses when off-screen.
- The simulation runs 1,000 futures on a canvas: particles gather, lines draw forward, then settle into a band.
- **Reduced motion:** no scrubbing, no toss, the cap renders a single still frame, words show at full strength, and every state change is instant.
- Only transform and opacity are animated. Grain is a fixed pointer-events-none layer.

## 7. Anti-Patterns (Banned)

- No single score, grade or "winner" verdict for a college.
- No invented numbers: every figure is labelled with its data kind and sample status.
- No emojis, no Inter, no pure #000000, no neon or outer glows, no purple/blue AI gradients.
- No three-equal-card rows, no centred hero, no dark section dropped into a light page.
- No hover-only functionality: every hover reveal also works by tap and keyboard.
- No em dashes in UI copy, no "Elevate / Seamless / Unleash / Next-gen" copywriting, no exclamation marks.
- No Lucide icons (Phosphor only), no generic placeholder names, no dead links.
- No z-index above the defined scale (sticky 30, nav 40, overlay 50, grain 60).
