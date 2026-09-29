# Visual review (agent vision) - final model vs reference.png

Implementation: features/start/grad-cap.tsx (hand-authored from object-sculpt-spec.json; the
generator's reference factory is in src/createObjectModel.ts for comparison).
Renders: review/render-left-3q.png, render-front.png, render-right-3q.png, render-high.png,
render-toss-mid.png (light theme, swiftshader WebGL).

Correction loop (2 iterations recorded):
1. FAIL identity feature "cord drapes over edge": cord ran to the rear edge, drop hidden.
   Fix: cord routed along board-local +z (camera-facing edge after the 45 deg turn); drop swings
   about x. PASS after fix.
2. FAIL material "bullion gradient": rendered deep red (sRGB->linear double conversion).
   Fix: remove extra conversion. PASS: orange to deeper orange tip like the reference.
3. FAIL framing: toss arc left the canvas. Fix: arc 0.24, flip 0.35 rad. PASS.

Identity checks: diamond board silhouette PASS; skullcap flare under board PASS; center button PASS;
draped cord PASS; hanging bullion PASS. Stylization declared: brand ink felt + accent satin instead
of the reference violet/yellow. Hidden underside assumed flat (stated in assumptions).

## Tier-1 deterministic diagnostics (forge/stage4_review/diagnose_render.py): FAIL
silhouette IoU 0.656 (gate 0.85), aspect-ratio delta 0.401 (gate 0.05), scale delta 0.242 (gate 0.08),
colour dE max 16.96 (brand stylization, expected). Cause: the website render uses the hero's own
camera, pointer-driven yaw and brand colours rather than the reference camera. The model is a
stylized hero prop; it has not passed the pipeline's fidelity gate, and the remaining locked passes
(structural .. optimization) were not formally gated. Next step if exact fidelity is wanted: add a
reference-camera render mode and iterate the spec until IoU >= 0.85.
