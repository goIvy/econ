"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { ButtonLink } from "@/components/ui/button";
import { SampleChip } from "@/components/ui/lineage";
import { moneyCompact, pct } from "@/lib/format";

// ThreeUI's CompleteShelfLandingPage (MIT) with its configured typography and colour.
// The page it frames is public/landing-pages/complete-shelf-v2.html, built from the
// authored source by scripts/build-college-shelf.mjs with universities as the volumes.
const CompleteShelfLandingPage = dynamic(() => import("@designcodeio/threeui/components/CompleteShelfLandingPage").then((m) => m.CompleteShelfLandingPage), {
  ssr: false,
  loading: () => <div aria-hidden className="absolute inset-0 bg-[#171a24]" />,
});

export interface ShelfCollege {
  id: string;
  name: string;
  shortName: string;
  place: string;
  majorId: string;
  earnings: number | null;
  debt: number | null;
  gradRate: number | null;
  acceptance: number | null;
}

/**
 * THE ELITE SHELF. Seven elite universities as clothbound volumes: browse the
 * shelf, pull one out, open it. Whatever you choose on the shelf is shown below
 * with its figures and the way into its full numbers.
 */
export function ShelfExperience({ colleges }: { colleges: ShelfCollege[] }) {
  const [chosenId, setChosenId] = useState(colleges[0]?.id);
  const chosen = colleges.find((c) => c.id === chosenId) ?? colleges[0];

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      const id = e.data?.cvlShelf?.collegeId;
      if (typeof id === "string" && colleges.some((c) => c.id === id)) setChosenId(id);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [colleges]);

  const figures: Array<[string, string]> = chosen
    ? [
        ["Median earnings, 10 yrs after entry", moneyCompact(chosen.earnings)],
        ["Median debt at graduation", moneyCompact(chosen.debt)],
        ["Graduate within 6 years", pct(chosen.gradRate)],
        ["Acceptance rate", pct(chosen.acceptance, 1)],
      ]
    : [];

  return (
    <div className="grid gap-3 px-2 pb-16 sm:px-3">
      <section aria-labelledby="shelf-h" className="grid gap-4 px-2 pb-4 pt-8 sm:px-6 md:pt-12">
        <h1 id="shelf-h" className="text-[clamp(2.8rem,6.4vw,5.4rem)] leading-[0.92] tracking-[-0.015em]">
          The <em>elite shelf</em>
        </h1>
        <p className="max-w-[40rem] text-lede text-ink-2">
          Seven elite universities as volumes. Scroll or use the arrows to browse, press Open to take one down, then see what that path really costs.
        </p>
      </section>

      <div id="shelf-frame" className="relative h-[calc(100dvh-7rem)] max-h-[56rem] min-h-[32rem] scroll-mt-[calc(var(--nav-h)+8px)] overflow-hidden rounded-lg bg-[#171a24] shadow-[0_0_0_1px_var(--rule)] sm:rounded-[36px]">
        <CompleteShelfLandingPage
          headingFont="iowan-old-style"
          bodyFont="inter"
          headingWeight="400"
          bodyWeight="400"
          primaryColor="#4689c8"
          headingSize={60}
          bodySize={12}
          headingLetterSpacing={-0.055}
          style={{ position: "absolute", inset: 0 }}
        />
      </div>

      {chosen && (
        <section aria-live="polite" aria-labelledby="chosen-h" className="bezel mx-auto mt-3 w-full max-w-[1200px]">
          <div className="bezel-core grid gap-6 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="grid gap-5">
              <div className="grid gap-1">
                <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted">Chosen from the shelf</p>
                <h2 id="chosen-h" className="text-[clamp(2.2rem,4vw,3.4rem)] leading-none">
                  {chosen.name}
                </h2>
                <p className="text-small text-ink-2">{chosen.place}</p>
              </div>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
                {figures.map(([k, v]) => (
                  <div key={k} className="grid gap-1">
                    <dt className="text-caption text-muted">{k}</dt>
                    <dd className="tabular text-h3 font-semibold text-ink">{v}</dd>
                  </div>
                ))}
              </dl>
              <SampleChip className="justify-self-start" />
            </div>
            <div className="flex flex-wrap gap-2 lg:flex-col lg:items-stretch">
              <ButtonLink href={`/college/${chosen.id}`} size="lg" trail className="justify-between pl-6">
                See {chosen.shortName}&apos;s full numbers
              </ButtonLink>
              <ButtonLink href={`/compare?p=${chosen.id}.${chosen.majorId}.r`} size="lg" variant="secondary">
                Compare {chosen.shortName}
              </ButtonLink>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
