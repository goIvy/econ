"use client";

import { useEffect, useState } from "react";
import { CollegeGallery } from "@/features/threeui/college-gallery";
import { drawPlates, type Plate } from "@/features/threeui/college-plates";
import { useScenario } from "@/features/scenario/store";

const PATHS: Array<[string, string]> = [
  ["uc-berkeley", "economics"],
  ["ut-austin", "computer-science"],
  ["georgia-state", "nursing"],
  ["nyu", "finance"],
  ["georgia-tech", "computer-science"],
  ["u-michigan", "nursing"],
  ["san-jose-state", "business-administration"],
];

/** The hero ribbon: ThreeUI's Gallery carrying plates drawn from real college paths. */
export function HeroGallery() {
  const { colleges, majors } = useScenario();
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    const plates: Plate[] = PATHS.flatMap(([cid, mid]) => {
      const c = colleges.find((x) => x.id === cid);
      const m = majors.find((x) => x.id === mid);
      return c && m && c.majorIds.includes(m.id) ? [{ name: c.shortName, major: m.name, meta: `${c.control === "public" ? "PUBLIC" : "PRIVATE"} · ${c.state}` }] : [];
    });
    const css = getComputedStyle(document.documentElement);
    const serif = css.getPropertyValue("--font-instrument-serif").trim() || "Georgia, serif";
    const sans = css.getPropertyValue("--font-geist-sans").trim() || "system-ui, sans-serif";
    let cancelled = false;
    // Draw once the display serif is loaded, so the plates use the real face.
    Promise.all([document.fonts.load(`400 150px ${serif}`), document.fonts.load(`italic 400 54px ${serif}`), document.fonts.load(`500 22px ${sans}`)])
      .catch(() => undefined)
      .then(() => {
        if (!cancelled) setImages(drawPlates(plates, serif, sans));
      });
    return () => {
      cancelled = true;
    };
  }, [colleges, majors]);

  return <CollegeGallery images={images} speed={1} scale={1} opacity={1} hue={0} saturation={1} brightness={1} style={{ position: "absolute", inset: 0, background: "transparent" }} />;
}
