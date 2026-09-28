"use client";

import { impliedGrowth } from "@/lib/calc";
import { TwoStudents, type TwoStudentsProps } from "@/features/experience/two-students";
import { useScenario } from "@/features/scenario/store";

/** "What you give up", started from your path's cost and pay. Resets when the path changes. */
export function GiveUp({ defaults }: { defaults: TwoStudentsProps }) {
  const { futures } = useScenario();
  const f = futures.find((x) => x.index === 0)!;
  const r = f.result;
  const mid = f.ctx.outcome.midCareerMedian.value ?? f.ctx.major.midCareerMedian.value ?? r.startingSalary;
  const props = {
    ...defaults,
    costPerYear: Math.round(r.net.netPrice / r.net.years / 1000) * 1000,
    graduateSalary: Math.round(r.startingSalary / 1000) * 1000,
    graduateGrowth: Math.round(impliedGrowth(r.startingSalary, mid) * 1000) / 1000,
    debt: Math.round(r.loan.principal / 1000) * 1000,
    pathLabel: f.ctx.college.shortName,
  };
  return <TwoStudents key={`${f.label}.${f.sel.aid}.${f.sel.residency}.${f.sel.living}`} {...props} />;
}
