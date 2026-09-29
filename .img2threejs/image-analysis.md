# Image analysis: reference.png (Fluent 3D "graduation cap", MIT, via @lobehub/fluent-emoji-3d)

## Layer 1 - Identification
Work type: academic mortarboard (graduation cap). Classification: soft furnishing / headwear prop.
primaryDomain: object. Confidence 0.97.

## Layer 2 - Form & silhouette
Two primitives: a thin square plate (the board, ~1.0 unit edge, ~0.06 unit thick) rotated ~45 deg
about the vertical axis and seen from a 3/4 elevated view; below it a truncated-cone skullcap
(top diameter ~0.62, bottom ~0.66, height ~0.30) with a slightly flared lower rim. Board is
bilateral-symmetric; the tassel breaks symmetry. Shape language: geometric, softly bevelled.

## Layer 3 - Decomposition
Macro: board, skullcap, tassel assembly.
Meso: board edge bevel; skullcap lower rim; tassel = center button + cord + drop (bullion) + head.
Micro: cord bend at the board edge (a ~90 deg drape), bullion flare with rounded tip.

## Layer 4 - Spatial relationships
<board, sits-on, skullcap> contact: butt (board centered on skullcap top, flush).
<button, attached-to, board top center> contact: embed.
<cord, runs-from, button> along the board top toward one corner-adjacent edge, then drapes over
the edge <cord, overlaps, board edge> and hangs below the board plane.
<tassel head, attached-to, cord end> contact: socket; tassel hangs in front of the skullcap.

## Layer 5 - Materials (PBR)
Board + skullcap: dielectric, metalness 0, roughness ~0.75 (felt/matte fabric), no visible grain at
this resolution. Tassel cord + bullion: dielectric, roughness ~0.45 (satin silk), metalness 0.
All opaque.

## Layer 6 - Color & finish
Board top: dark desaturated violet, value low (baked light gradient from upper-left, not albedo).
Skullcap: same hue, slightly more saturated. Tassel: gradient stops yellow-orange (cord, value high)
to orange-red (bullion tip). Finish: matte fabric, satin tassel.
Brand mapping (stylized): board/skullcap -> site ink (near-black zinc); tassel -> site accent
(burnt orange #d9622a / #e06a2b). This is a deliberate stylization, stated here.

## Layer 7 - Identity features
The draped cord over the board edge and the hanging bullion tassel are what make the object read
as a graduation cap rather than a plain board: both are featureReviewTargets.

## Layer 8 - Uncertainty
Hidden: the underside of the board and the back of the skullcap (single view). The exact cord
attachment point is soft at 96 px source resolution (upscaled to 512); treat cord radius and
bullion length as approximate. Output is declared STYLIZED, low-poly-plus (soft bevels), not an
exact geometric match.
