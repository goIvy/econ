"use client";

import { useMemo } from "react";
import { TextPathStudy, TEXT_PATH_DEFINITIONS } from "./vendor/text-path-studies.js";

const AUTHORED = 'var PHRASE = "everypointonthisballisapathbacktoanotherone";';
/** Our phrase, set letter by letter across the land (the study's own style: lowercase, no spaces). */
const OURS = 'var PHRASE = "everycollegeisapathcomparethecostthedebtthepayandwhenitpaysoff";';

/**
 * ThreeUI <TextPathStudies variant="globe-study" /> (MIT): the typographic world
 * sphere with drag rotation, wheel zoom, pointer lighting and click-to-pin
 * markers. Made ours by one change to the authored source: the phrase the
 * continents are written in.
 */
export function CollegeGlobe({ mode = "light", className, style }: { mode?: "light" | "dark"; className?: string; style?: React.CSSProperties }) {
  const definition = useMemo(() => {
    const d = TEXT_PATH_DEFINITIONS.globe;
    if (!d.source.includes(AUTHORED)) throw new Error("Globe adapter could not find the authored phrase.");
    return { ...d, source: d.source.replace(AUTHORED, OURS) };
  }, []);
  return <TextPathStudy definition={definition} mode={mode} scale={1} opacity={1} hue={0} saturation={1} brightness={1} className={className} style={style} />;
}
