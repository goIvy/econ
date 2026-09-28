"use client";

import { useCallback, useState } from "react";
import { CollegeHero, type CollegeHeroProps } from "./college-hero";
import { CollegeWorkspace, type PathSummary } from "./college-workspace";

type WorkspaceProps = Omit<React.ComponentProps<typeof CollegeWorkspace>, "onResult">;

/**
 * College detail: the hero and the workspace share one path, so changing the
 * major or residency below updates the big numbers (and breadcrumb) above.
 */
export function CollegeDetail({ hero, workspace }: { hero: CollegeHeroProps; workspace: WorkspaceProps }) {
  const [live, setLive] = useState<PathSummary | null>(null);
  const onResult = useCallback((s: PathSummary) => setLive(s), []);
  const props: CollegeHeroProps = live
    ? { ...hero, major: live.majorName, metrics: { netCost: live.netCost, employment: live.employment, salary: live.salary, debt: live.debt, breakEven: live.breakEven }, series: live.series, base: live.base }
    : hero;
  return (
    <>
      <CollegeHero {...props} />
      <div className="mx-auto max-w-[1200px] px-4 pb-20 pt-8 md:px-8 xl:px-12">
        <CollegeWorkspace {...workspace} onResult={onResult} />
      </div>
    </>
  );
}
