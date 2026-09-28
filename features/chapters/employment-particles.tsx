"use client";

import { motion, useInView } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { useRef, useState } from "react";
import { useMeasuredWidth } from "@/components/motion";
import { Segmented } from "@/components/ui/segmented";
import { SampleChip, SourceFootnote } from "@/components/ui/lineage";
import { EASE } from "@/lib/animations";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import type { Lineage } from "@/types";

interface MajorEmployment {
  id: string;
  name: string;
  employment: number;
  unemployment: number;
  gradSchool: number;
  lineage: Lineage;
}

const GROUPS = [
  { key: "employed", label: "Employed", color: "var(--trace-a)" },
  { key: "grad", label: "Graduate school", color: "var(--trace-b)" },
  { key: "unemployed", label: "Unemployed", color: "var(--trace-e)" },
  { key: "other", label: "Other / unavailable", color: "var(--trace-c)" },
] as const;
type GroupKey = (typeof GROUPS)[number]["key"];

/** 100 graduates split by defined rates (never random). */
export function splitHundred(m: MajorEmployment): Record<GroupKey, number> {
  const grad = Math.round(m.gradSchool);
  const labor = 100 - grad;
  const employed = Math.round((labor * m.employment) / 100);
  const unemployed = Math.min(labor - employed, Math.round((labor * m.unemployment) / 100));
  return { employed, grad, unemployed, other: Math.max(0, 100 - grad - employed - unemployed) };
}

/**
 * EMPLOYMENT OUTCOMES. 100 graduates start as one group; on scroll they walk
 * to where they are a year after graduating. Transforms only; staggered.
 */
export function EmploymentParticles({ majors }: { majors: MajorEmployment[] }) {
  const [id, setId] = useState(majors[0].id);
  const m = majors.find((x) => x.id === id)!;
  const counts = splitHundred(m);
  const [ref, W] = useMeasuredWidth<HTMLDivElement>(1000);
  const viewRef = useRef<HTMLDivElement>(null);
  const inView = useInView(viewRef, { once: true, margin: "0px 0px -25% 0px" });
  const reduce = useReducedMotion();
  const [together, setTogether] = useState(false);
  const grouped = (inView || reduce) && !together;

  const narrow = W < 640;
  const gap = narrow ? 11 : 16;
  const perRowN = narrow ? 8 : 10;
  const maxRows = Math.ceil(Math.max(...Object.values(counts)) / perRowN);
  // Tall enough for the starting 10×10 block or the tallest group, plus its label.
  const H = narrow ? Math.max(30 + 10 * gap + 40, 2 * (30 + Math.ceil(Math.max(counts.employed, counts.grad) / perRowN) * gap + 60)) : Math.max(30 + 10 * gap + 40, 30 + maxRows * gap + 70);
  // Assign each of the 100 dots to a group, in group order.
  const assign: GroupKey[] = GROUPS.flatMap((g) => Array.from({ length: counts[g.key] }, () => g.key));
  const colWidth = narrow ? W / 2 : W / 4;
  const perRow = perRowN;
  const clusterPos = (g: GroupKey, k: number) => {
    const gi = GROUPS.findIndex((x) => x.key === g);
    const col = narrow ? gi % 2 : gi;
    const rowBlock = narrow ? Math.floor(gi / 2) : 0;
    const cx0 = col * colWidth + (colWidth - (perRow - 1) * gap) / 2;
    const cy0 = 30 + rowBlock * (H / 2);
    return { x: cx0 + (k % perRow) * gap, y: cy0 + Math.floor(k / perRow) * gap };
  };
  const startPos = (i: number) => ({ x: W / 2 - 4.5 * gap + (i % 10) * gap, y: 30 + Math.floor(i / 10) * gap });
  const seen: Record<GroupKey, number> = { employed: 0, grad: 0, unemployed: 0, other: 0 };

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <Segmented label="Major" size="sm" wrap value={id} onChange={setId} options={majors.map((x) => ({ value: x.id, label: x.name.replace("Computer Science", "Comp. Sci.") }))} />
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setTogether((t) => !t)} className="flex h-10 items-center gap-2 rounded-sm px-3 text-small font-semibold text-ink-2 hover:bg-surface hover:text-ink">
            <RotateCcw className="size-4" aria-hidden />
            {together ? "Show outcomes" : "Back to one group"}
          </button>
          <SampleChip />
          <SourceFootnote metric={`${m.name} employment outcomes`} lineage={m.lineage} n={1} />
        </div>
      </div>

      <div ref={viewRef} className="rounded-lg border border-rule bg-surface p-4 sm:p-6">
        <div ref={ref} className="min-w-0">
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="block max-w-full" role="img" aria-label={`Of 100 recent ${m.name} graduates: ${counts.employed} employed, ${counts.grad} in graduate school, ${counts.unemployed} unemployed, ${counts.other} other or unavailable.`}>
            {assign.map((g, i) => {
              const k = seen[g]++;
              const to = grouped ? clusterPos(g, k) : startPos(i);
              const color = GROUPS.find((x) => x.key === g)!.color;
              return (
                <motion.circle
                  key={i}
                  r={narrow ? 4 : 5.5}
                  cx={0}
                  cy={0}
                  initial={false}
                  animate={{ x: to.x, y: to.y, fill: grouped ? color : "var(--ink-2)" }}
                  transition={reduce ? { duration: 0 } : { duration: 0.9, ease: EASE.smooth, delay: grouped ? (i % 25) * 0.012 + Math.floor(i / 25) * 0.05 : (99 - i) * 0.004 }}
                />
              );
            })}
            {GROUPS.map((g, gi) => {
              const col = narrow ? gi % 2 : gi;
              const rowBlock = narrow ? Math.floor(gi / 2) : 0;
              const rows = Math.ceil(Math.max(1, counts[g.key]) / perRow);
              const y = 30 + rowBlock * (H / 2) + rows * gap + 10;
              return (
                <motion.g key={g.key} initial={false} animate={{ opacity: grouped ? 1 : 0, y: grouped ? 0 : 8 }} transition={{ duration: 0.5, delay: grouped ? 0.9 : 0 }}>
                  <text x={col * colWidth + colWidth / 2} y={y + 14} textAnchor="middle" className="tabular fill-ink text-[28px] font-extrabold">
                    {counts[g.key]}
                  </text>
                  <text x={col * colWidth + colWidth / 2} y={y + 34} textAnchor="middle" className="fill-muted text-[12px] font-semibold">
                    {g.label}
                  </text>
                </motion.g>
              );
            })}
            {!grouped && (
              <text x={W / 2} y={30 + 10 * gap + 16} textAnchor="middle" className="fill-muted text-[13px] font-semibold">
                100 recent {m.name.toLowerCase()} graduates
              </text>
            )}
          </svg>
        </div>
      </div>
      <p className="max-w-[60ch] text-small text-ink-2">
        One year after graduating, per 100 graduates. Graduate school comes off the top; the rest are split by the major&apos;s employment and unemployment rates. &quot;Other&quot; covers people outside the labor force or without reported data.
      </p>
    </div>
  );
}
