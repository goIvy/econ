"use client";

import dynamic from "next/dynamic";

// ThreeUI's PredictiveArcCanvas (MIT): the violet predictive pixel arch with a luminous core.
const PredictiveArcCanvas = dynamic(() => import("@designcodeio/threeui/components/PredictiveArcCanvas").then((m) => m.PredictiveArcCanvas), {
  ssr: false,
  loading: () => <div aria-hidden className="absolute inset-0 bg-[#0a0a0a]" />,
});

/** A small predictive "screen" beside the Possible futures question. Decoration only. */
export function PredictiveArcTile() {
  return (
    <div aria-hidden className="relative h-44 w-full overflow-hidden rounded-md bg-[#0a0a0a] shadow-[0_0_0_1px_var(--rule)] sm:h-52 lg:w-[22rem]">
      <PredictiveArcCanvas mode="dark" speed={1} hue={0} saturation={1} brightness={1} />
    </div>
  );
}
