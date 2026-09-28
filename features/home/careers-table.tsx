"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useMemo, useState } from "react";
import { SampleChip, SourceFootnote } from "@/components/ui/lineage";
import { InfoTip } from "@/components/ui/info-tip";
import { enterSpring } from "@/lib/animations";
import { money, moneyCompact, pct } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { MajorRowData } from "./data";

type SortKey = "name" | "median" | "mid" | "unemployment" | "gradSchool";
const SCALE_MAX = 160000;

/**
 * Majors compared as a table with an inline earnings range per row:
 * the 10th–90th percentile whisker, the middle half as a bar, the median tick.
 */
export function CareersTable({ rows }: { rows: MajorRowData[] }) {
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "median", dir: -1 });
  const sorted = useMemo(() => {
    const get = (r: MajorRowData) => ({ name: r.name, median: r.early.p50, mid: r.mid, unemployment: r.unemployment, gradSchool: r.gradSchool })[sort.key];
    return [...rows].sort((a, b) => {
      const x = get(a), y = get(b);
      return (typeof x === "string" ? x.localeCompare(y as string) : (x as number) - (y as number)) * sort.dir;
    });
  }, [rows, sort]);

  const header = (key: SortKey, label: string, align: "left" | "right" = "right", tip?: string) => {
    const active = sort.key === key;
    return (
      <th scope="col" aria-sort={active ? (sort.dir === 1 ? "ascending" : "descending") : "none"} className={cn("px-3 py-3 font-medium", align === "right" ? "text-right" : "text-left")}>
        <span className={cn("inline-flex items-center gap-1", align === "right" && "flex-row-reverse")}>
          <button
            type="button"
            onClick={() => setSort((s) => ({ key, dir: s.key === key ? ((-s.dir) as 1 | -1) : key === "name" ? 1 : -1 }))}
            className={cn("inline-flex items-center gap-1 rounded-xs hover:text-ink", active ? "text-ink" : "text-muted")}
          >
            {label}
            {active ? sort.dir === 1 ? <ArrowUp className="size-3" aria-hidden /> : <ArrowDown className="size-3" aria-hidden /> : null}
          </button>
          {tip && <InfoTip label={label}>{tip}</InfoTip>}
        </span>
      </th>
    );
  };

  const x = (v: number) => `${Math.min(100, (v / SCALE_MAX) * 100)}%`;

  return (
    <div className="rounded-lg border border-rule bg-surface shadow-2">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule px-4 py-3 sm:px-6">
        <p className="text-small font-semibold text-ink">
          Early-career earnings, ages 22–27
          <SourceFootnote metric="Early-career earnings by major" lineage={rows[0].lineage} n={1} className="ml-1" />
        </p>
        <div className="flex items-center gap-4 text-caption text-muted">
          <span className="hidden items-center gap-2 sm:flex" aria-hidden>
            <span className="relative h-2.5 w-12">
              <span className="absolute inset-y-[4px] left-0 right-0 bg-rule-strong" />
              <span className="absolute inset-y-0 left-2 right-3 rounded-[3px] bg-ink/20" />
              <span className="absolute inset-y-[-2px] left-6 w-[2px] bg-ink" />
            </span>
            10th–90th percentile, middle half, median
          </span>
          <SampleChip />
        </div>
      </div>
      {/* phones: each major becomes a card-row */}
      <div className="flex justify-between border-b border-rule px-4 py-2 text-[0.75rem] text-muted tabular md:hidden" aria-hidden>
        <span>$0</span>
        <span>{moneyCompact(SCALE_MAX / 2)}</span>
        <span>{moneyCompact(SCALE_MAX)}</span>
      </div>
      <ul className="divide-y divide-rule md:hidden">
        {sorted.map((r) => (
          <li key={r.id} className="grid gap-2 px-4 py-4">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-medium text-ink">{r.name}</span>
              <span className="tabular text-small font-semibold text-ink">{money(r.early.p50)}</span>
            </div>
            <div className="relative h-4" role="img" aria-label={`10th percentile ${money(r.early.p10)}, median ${money(r.early.p50)}, 90th ${money(r.early.p90)}`}>
              <span className="absolute top-1/2 h-px -translate-y-1/2 bg-rule-strong" style={{ left: x(r.early.p10), width: `calc(${x(r.early.p90)} - ${x(r.early.p10)})` }} />
              <span className="absolute inset-y-[3px] rounded-[3px] bg-ink/15" style={{ left: x(r.early.p25), width: `calc(${x(r.early.p75)} - ${x(r.early.p25)})` }} />
              <span className="absolute inset-y-0 w-[2px] rounded-full bg-ink" style={{ left: x(r.early.p50) }} />
            </div>
            <dl className="grid grid-cols-3 gap-2 text-caption">
              <div><dt className="text-muted">Mid-career</dt><dd className="tabular font-semibold text-ink-2">{moneyCompact(r.mid)}</dd></div>
              <div><dt className="text-muted">Unemployed</dt><dd className="tabular font-semibold text-ink-2">{pct(r.unemployment, 1)}</dd></div>
              <div><dt className="text-muted">Grad degree</dt><dd className="tabular font-semibold text-ink-2">{pct(r.gradSchool)}</dd></div>
            </dl>
          </li>
        ))}
      </ul>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[44rem] text-small">
          <caption className="sr-only">Earnings and outcomes by major. Sortable columns.</caption>
          <thead className="text-caption">
            <tr className="border-b border-rule">
              {header("name", "Major", "left")}
              <th scope="col" className="w-[36%] px-3 py-3 text-left font-medium text-muted">
                <span className="flex justify-between tabular">
                  <span>$0</span>
                  <span>{moneyCompact(SCALE_MAX / 2)}</span>
                  <span>{moneyCompact(SCALE_MAX)}</span>
                </span>
              </th>
              {header("median", "Median")}
              {header("mid", "Mid-career", "right", "Typical earnings for graduates aged 35–45 with this major.")}
              {header("unemployment", "Unemployed", "right", "Share of recent graduates in the labor force who are looking for work.")}
              {header("gradSchool", "Grad degree", "right", "Share who go on to earn a graduate degree, which changes both cost and earnings.")}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {sorted.map((r) => (
                <motion.tr key={r.id} layout transition={enterSpring} className="border-b border-rule last:border-b-0 hover:bg-paper">
                  <th scope="row" className="px-3 py-3 text-left font-medium text-ink">
                    {r.name}
                    <span className="block text-caption font-normal text-muted">{r.category}</span>
                  </th>
                  <td className="px-3 py-3">
                    <div className="relative h-4" role="img" aria-label={`10th percentile ${money(r.early.p10)}, 25th ${money(r.early.p25)}, median ${money(r.early.p50)}, 75th ${money(r.early.p75)}, 90th ${money(r.early.p90)}`}>
                      <span className="absolute top-1/2 h-px -translate-y-1/2 bg-rule-strong" style={{ left: x(r.early.p10), width: `calc(${x(r.early.p90)} - ${x(r.early.p10)})` }} />
                      <span className="absolute inset-y-[3px] rounded-[3px] bg-ink/15" style={{ left: x(r.early.p25), width: `calc(${x(r.early.p75)} - ${x(r.early.p25)})` }} />
                      <span className="absolute inset-y-0 w-[2px] rounded-full bg-ink" style={{ left: x(r.early.p50) }} />
                    </div>
                  </td>
                  <td className="tabular px-3 py-3 text-right font-semibold text-ink">{money(r.early.p50)}</td>
                  <td className="tabular px-3 py-3 text-right text-ink-2">{money(r.mid)}</td>
                  <td className="tabular px-3 py-3 text-right text-ink-2">{pct(r.unemployment, 1)}</td>
                  <td className="tabular px-3 py-3 text-right text-ink-2">{pct(r.gradSchool)}</td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
      <p className="border-t border-rule px-4 py-3 text-caption text-muted sm:px-6">
        National figures for bachelor&apos;s degree holders. A specific college&apos;s graduates can differ, and higher-earning majors also attract students who might have earned more anyway.
      </p>
    </div>
  );
}
