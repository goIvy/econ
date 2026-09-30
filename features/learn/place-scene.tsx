"use client";

import dynamic from "next/dynamic";
import { InteractGuard } from "@/components/ui/interact-guard";

// ThreeUI's JapaneseTowerLandscape (MIT), Turkey variant: an Ottoman mosque with limestone
// ashlar, Iznik tile, a lead dome and twin pencil minarets, in a procedural landscape.
// It frames the authored page served from /japanese-tower.html (copied byte-for-byte).
const JapaneseTowerLandscape = dynamic(() => import("@designcodeio/threeui/components/JapaneseTowerLandscape").then((m) => m.JapaneseTowerLandscape), {
  ssr: false,
  loading: () => <div aria-hidden className="absolute inset-0 bg-[#e9e4da]" />,
});

/** A banner for the purchasing-power lesson: place changes the math. */
export function PlaceScene() {
  return (
    <figure className="relative mb-10 aspect-[4/5] overflow-hidden rounded-lg bg-[#e9e4da] shadow-[0_0_0_1px_var(--rule)] sm:aspect-[16/10] sm:rounded-[36px]">
      <InteractGuard label="Click to explore the scene" className="absolute inset-0">
        <JapaneseTowerLandscape country="turkey" />
      </InteractGuard>
      <figcaption className="pointer-events-none absolute bottom-4 left-4 right-4 max-w-[26rem] rounded-md bg-[color-mix(in_srgb,var(--surface)_85%,transparent)] px-4 py-3 text-small text-ink shadow-[0_0_0_1px_var(--rule)] backdrop-blur-md sm:bottom-6 sm:left-6">
        <span className="font-serif text-[1.35rem] leading-tight">
          Where you live changes <em className="text-accent-ink">what a dollar buys.</em>
        </span>
      </figcaption>
    </figure>
  );
}
