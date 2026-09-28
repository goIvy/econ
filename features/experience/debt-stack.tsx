"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatedNumber } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { GraduatedSlider } from "@/components/ui/graduated-slider";
import { SampleChip } from "@/components/ui/lineage";
import { DEFAULT_RATES, projectPath } from "@/lib/calc";
import { block, ledgerItem } from "@/lib/animations";
import { money, moneyCompact, pct } from "@/lib/format";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/cn";
import { PathPicker } from "./path-picker";
import type { PathPreset } from "./data";

const UNIT = 1000;
const YEAR_MS = 650;

/**
 * Debt made physical: every block is $1,000 you will repay. Solid blocks are
 * what you borrowed, hatched blocks are interest added while in school, and
 * outlined blocks are interest you'll pay during repayment. Aid removes
 * blocks; a higher rate adds them; "Play repayment" pays them off year by year.
 */
export function DebtStack({ presets }: { presets: PathPreset[] }) {
  const reduce = useReducedMotion();
  const [key, setKey] = useState<PathPreset["key"]>("a");
  const preset = presets.find((p) => p.key === key)!;
  const [aid, setAid] = useState(preset.inputs.funding.aidPerYear);
  const [rate, setRate] = useState(DEFAULT_RATES["federal-unsubsidized"]);
  const [year, setYear] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const loan = useMemo(
    () => projectPath({ ...preset.inputs, funding: { ...preset.inputs.funding, aidPerYear: aid } }, preset.ctx, { loanRatePct: rate }).loan,
    [preset, aid, rate],
  );
  const term = loan.schedule.length - 1;
  const point = loan.schedule[Math.min(year, term)];
  const interestLeft = loan.schedule.slice(Math.min(year, term) + 1).reduce((s, p) => s + p.interestPaid, 0);
  const paidInterest = loan.schedule.slice(1, Math.min(year, term) + 1).reduce((s, p) => s + p.interestPaid, 0);
  const paidPrincipal = loan.repaymentBalance - point.balance;
  const capShare = loan.repaymentBalance > 0 ? loan.inSchoolInterest / loan.repaymentBalance : 0;

  const counts = {
    principal: Math.round((point.balance * (1 - capShare)) / UNIT),
    capitalized: Math.round((point.balance * capShare) / UNIT),
    future: Math.round(interestLeft / UNIT),
  };

  const stop = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    setPlaying(false);
  };
  useEffect(() => () => stop(), []);
  const play = () => {
    if (playing) return stop();
    if (reduce) {
      setYear(term);
      return;
    }
    let y = year >= term ? 0 : year;
    setYear(y);
    setPlaying(true);
    timer.current = setInterval(() => {
      y += 1;
      setYear(y);
      if (y >= term) stop();
    }, YEAR_MS);
  };
  const change = (fn: () => void) => {
    stop();
    setYear(0);
    fn();
  };

  const thisYear = year > 0 ? loan.schedule[year] : null;

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PathPicker presets={presets} value={key} onChange={(k) => change(() => { setKey(k); setAid(presets.find((p) => p.key === k)!.inputs.funding.aidPerYear); })} label="Debt path" />
        <SampleChip />
      </div>

      <div className="grid gap-6 rounded-lg border border-rule bg-surface p-4 shadow-2 sm:p-6 lg:grid-cols-12 lg:gap-10">
        <div className="grid content-start gap-6 lg:col-span-4">
          <GraduatedSlider label="Grant aid per year" value={aid} onChange={(v) => change(() => setAid(v))} min={0} max={50000} step={1000} format={moneyCompact} description="More aid, fewer blocks." />
          <GraduatedSlider label="Interest rate" value={rate} onChange={(v) => change(() => setRate(v))} min={3} max={10} step={0.25} format={(v) => pct(v, 2)} description="Federal undergraduate rate is 6.53% (2024–25)." />
          <div className="flex flex-wrap gap-2">
            <Button onClick={play} disabled={loan.principal <= 0} aria-pressed={playing} className="gap-2">
              {playing ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />}
              {playing ? "Pause" : year >= term && year > 0 ? "Replay repayment" : "Play repayment"}
            </Button>
            {year > 0 && !playing && (
              <Button variant="quiet" onClick={() => setYear(0)} className="gap-2">
                <RotateCcw className="size-4" aria-hidden /> Reset
              </Button>
            )}
          </div>
          <Legend />
        </div>

        <div className="grid min-w-0 content-start gap-4 lg:col-span-8">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Big label={year === 0 ? "Owed at graduation" : `Owed after year ${year}`} value={point.balance} strong />
            <Big label="Monthly payment" value={loan.monthlyPayment} />
            <Big label="Principal repaid" value={paidPrincipal} />
            <Big label="Interest paid" value={paidInterest} />
          </div>

          <div className="relative h-[250px] rounded-md bg-surface-sunk p-3 sm:h-[300px]" role="img" aria-label={`${counts.principal + counts.capitalized} blocks of balance and ${counts.future} blocks of future interest, each $1,000.`}>
            {/* A fixed-width tower: rows pack from the bottom (wrap-reverse), so the pile grows upward. */}
            <ul className="mx-auto flex h-full w-[269px] flex-wrap-reverse content-start gap-[3px] sm:w-[301px]" aria-hidden>
              <AnimatePresence initial={false}>
                {Array.from({ length: counts.principal }, (_, i) => (
                  <motion.li key={`p${i}`} layout={!reduce} variants={block} custom={i} initial="hidden" animate="visible" exit="exit" className="size-3.5 rounded-[3px] bg-ink sm:size-4" />
                ))}
                {Array.from({ length: counts.capitalized }, (_, i) => (
                  <motion.li key={`c${i}`} layout={!reduce} variants={block} custom={i} initial="hidden" animate="visible" exit="exit" className="aid-hatch size-3.5 rounded-[3px] border border-ink sm:size-4" />
                ))}
                {Array.from({ length: counts.future }, (_, i) => (
                  <motion.li key={`f${i}`} layout={!reduce} variants={block} custom={i} initial="hidden" animate="visible" exit="exit" className="size-3.5 rounded-[3px] border-[1.5px] border-dashed border-ink/60 sm:size-4" />
                ))}
              </AnimatePresence>
            </ul>
            {loan.principal <= 0 && <p className="absolute inset-0 grid place-items-center text-small text-ink-2">No loans needed on this path with this much aid.</p>}
          </div>

          <AnimatePresence mode="wait" initial={false}>
            {thisYear ? (
              <motion.div key={`y${year}`} variants={ledgerItem} initial="hidden" animate="visible" exit="exit" className="grid gap-2" aria-live="polite">
                <p className="text-small text-ink-2">
                  Year {year}: paid <strong className="font-semibold text-ink">{money(thisYear.principalPaid + thisYear.interestPaid)}</strong>. {money(thisYear.principalPaid)} went to principal and {money(thisYear.interestPaid)} to interest.
                </p>
                <div className="flex h-3 overflow-hidden rounded-full" aria-hidden>
                  <motion.span className="h-full bg-ink" initial={false} animate={{ width: `${(thisYear.principalPaid / (thisYear.principalPaid + thisYear.interestPaid)) * 100}%` }} />
                  <span className="aid-hatch h-full grow" />
                </div>
              </motion.div>
            ) : (
              <motion.p key="intro" variants={ledgerItem} initial="hidden" animate="visible" exit="exit" className="text-small text-ink-2">
                Borrowed {money(loan.principal)}. Interest while in school adds {money(loan.inSchoolInterest)} before the first payment, and {money(loan.totalInterest - loan.inSchoolInterest)} more over ten years of payments.
              </motion.p>
            )}
          </AnimatePresence>

          <ol className="flex flex-wrap gap-x-2 gap-y-1 text-caption text-muted" aria-label="Balance at the end of each year">
            {loan.schedule.slice(0, year + 1).map((p) => (
              <motion.li key={p.year} variants={ledgerItem} initial="hidden" animate="visible" className={cn("tabular", p.year === year && "font-semibold text-ink")}>
                {p.year > 0 && <span aria-hidden className="mr-2">↓</span>}
                {moneyCompact(p.balance)}
              </motion.li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

function Big({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className="grid gap-0.5">
      <p className="text-caption text-muted">{label}</p>
      <p className={cn("font-semibold text-ink", strong ? "text-h2" : "text-h3")}>
        <AnimatedNumber value={value} format={money} />
      </p>
    </div>
  );
}

function Legend() {
  return (
    <ul className="grid gap-2 text-small text-ink-2">
      <li className="flex items-center gap-2">
        <span className="size-4 rounded-[3px] bg-ink" aria-hidden /> $1,000 borrowed
      </li>
      <li className="flex items-center gap-2">
        <span className="aid-hatch size-4 rounded-[3px] border border-ink" aria-hidden /> $1,000 interest added in school
      </li>
      <li className="flex items-center gap-2">
        <span className="size-4 rounded-[3px] border-[1.5px] border-dashed border-ink/60" aria-hidden /> $1,000 interest still to pay
      </li>
    </ul>
  );
}
