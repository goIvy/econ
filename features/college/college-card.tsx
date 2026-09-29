"use client";

import Link from "next/link";
import { ViewTransition } from "react";
import { motion } from "framer-motion";
import { Check, Plus } from "@/components/ui/icons";
import { useCompareList } from "@/hooks/use-compare-list";
import { microSpring } from "@/lib/animations";
import { money, number, pct } from "@/lib/format";
import { cn } from "@/lib/cn";

export interface CollegeCardData {
  id: string;
  name: string;
  city: string;
  state: string;
  control: "public" | "private";
  tuitionIn: number;
  tuitionOut: number;
  netPrice: number | null;
  gradRate6: number | null;
  medianEarnings: number | null;
  medianDebt: number | null;
  enrollment: number | null;
  acceptance: number | null;
}

/** Search result: a horizontal record, not a tile, so results scan like a table. */
export function CollegeCard({ c }: { c: CollegeCardData }) {
  const { ids, toggle, full } = useCompareList();
  const on = ids.includes(c.id);
  const disabled = !on && full;
  return (
    <motion.article
      layout
      transition={microSpring}
      className={cn("group grid gap-4 rounded-md border bg-surface p-4 shadow-1 transition-[border-color,box-shadow] sm:p-5 md:grid-cols-[1fr_auto] md:items-center", on ? "border-trace-a shadow-2" : "border-rule hover:border-rule-strong hover:shadow-2")}
    >
      <div className="grid min-w-0 gap-3">
        <div className="min-w-0">
          <h3 className="text-h3 font-[650]">
            {/* Shares its name with the detail page title, so the title glides into place on navigation. */}
            <ViewTransition name={`college-name-${c.id}`}>
              <Link href={`/college/${c.id}`} className="inline-block rounded-xs hover:underline hover:decoration-rule-strong">
                {c.name}
              </Link>
            </ViewTransition>
          </h3>
          <p className="text-small text-muted">
            {c.city}, {c.state} · {c.control === "public" ? "Public" : "Private nonprofit"}
            {c.enrollment != null && ` · ${number(c.enrollment)} undergraduates`}
          </p>
        </div>
        <ViewTransition name={`college-stats-${c.id}`}>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-[repeat(5,auto)] sm:justify-start sm:gap-x-8">
          <Stat label={c.control === "public" ? "Tuition (in / out)" : "Tuition"} value={c.control === "public" ? `${compactK(c.tuitionIn)} / ${compactK(c.tuitionOut)}` : money(c.tuitionIn)} />
          <Stat label="Avg. net price" value={money(c.netPrice)} />
          <Stat label="Graduation rate" value={pct(c.gradRate6)} />
          <Stat label="Median earnings" value={money(c.medianEarnings)} />
          <Stat label="Typical debt" value={money(c.medianDebt)} />
        </dl>
        </ViewTransition>
      </div>
      <div className="flex items-center gap-2 md:flex-col md:items-stretch">
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={() => toggle(c.id)}
          disabled={disabled}
          aria-pressed={on}
          title={disabled ? "You can compare up to 5 colleges. Remove one first." : undefined}
          className={cn(
            "inline-flex h-10 items-center justify-center gap-1.5 rounded-sm border px-4 text-small font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
            on ? "border-trace-a bg-trace-a text-on-ink" : "border-rule-strong bg-surface text-ink hover:border-ink",
          )}
        >
          {on ? <Check className="size-4" aria-hidden /> : <Plus className="size-4" aria-hidden />}
          {on ? "Comparing" : "Compare"}
        </motion.button>
        <Link href={`/college/${c.id}`} className="inline-flex h-10 items-center justify-center rounded-sm px-4 text-small font-semibold text-ink-2 hover:bg-surface-sunk hover:text-ink">
          Details
        </Link>
      </div>
    </motion.article>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-0.5">
      <dt className="text-[0.75rem] text-muted">{label}</dt>
      <dd className="tabular whitespace-nowrap text-small font-semibold text-ink">{value}</dd>
    </div>
  );
}

const compactK = (n: number) => `$${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
