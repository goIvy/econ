"use client";

import dynamic from "next/dynamic";

// ThreeUI's SemanticBloom (MIT): a particle organism that searches out the letters and lights them up.
const SemanticBloom = dynamic(() => import("@designcodeio/threeui/components/SemanticBloom").then((m) => m.SemanticBloom), {
  ssr: false,
  loading: () => <div aria-hidden className="absolute inset-0 bg-[#f4f4f2]" />,
});

/** The sign-off before the footer: our name, grown into light. */
export function Wordmark() {
  return (
    <section aria-label="College Value Lab" className="relative px-2 pb-2 sm:px-3 sm:pb-3">
      <div className="relative h-[46vh] min-h-[18rem] overflow-hidden rounded-lg bg-[#f4f4f2] shadow-[0_0_0_1px_var(--rule)] sm:rounded-[36px]">
        <SemanticBloom mode="light" text="College Value Lab" size={0.8} opacity={1} style={{ position: "absolute", inset: 0 }} />
      </div>
    </section>
  );
}
