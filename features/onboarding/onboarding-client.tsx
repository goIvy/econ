"use client";

import dynamic from "next/dynamic";

/** Onboarding restores answers from this browser, so it renders on the client only. */
export const OnboardingClient = dynamic(() => import("./onboarding").then((m) => m.Onboarding), {
  ssr: false,
  loading: () => (
    <div className="mx-auto grid max-w-[44rem] gap-8" aria-busy="true" aria-label="Loading">
      <div className="h-2 animate-pulse rounded-full bg-surface-sunk" />
      <div className="h-10 w-3/4 animate-pulse rounded bg-surface-sunk" />
      <div className="grid gap-2 sm:grid-cols-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-md bg-surface-sunk" />
        ))}
      </div>
    </div>
  ),
});
