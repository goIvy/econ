"use client";

import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { Pause, Play, X } from "lucide-react";
import { Dialog } from "radix-ui";
import { useEffect, useRef, useState } from "react";
import { AnimatedNumber, useMeasuredWidth } from "@/components/motion";
import { GraduatedSlider } from "@/components/ui/graduated-slider";
import { Segmented } from "@/components/ui/segmented";
import { linear, linePath } from "@/components/charts/scale";
import { NO_COLLEGE, adjustForInflation, calculateDisposableIncome, compoundSeries, loanSchedule, calculateLoanPayment, projectSalary } from "@/lib/calc";
import { DUR, EASE } from "@/lib/animations";
import { money, moneyCompact, pct } from "@/lib/format";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/cn";
import type { LessonInputs } from "./data";

type LessonId = "opportunity" | "purchasing" | "expected" | "debt" | "inflation" | "human" | "risk" | "npv";
const LESSONS: Array<{ id: LessonId; title: string; hook: string; span?: string }> = [
  { id: "opportunity", title: "Opportunity Cost", hook: "Spend $20,000 now, or invest it?", span: "md:col-span-2 md:row-span-2" },
  { id: "purchasing", title: "Purchasing Power", hook: "$100K in San Francisco vs. Cleveland.", span: "md:col-span-2" },
  { id: "debt", title: "Debt Interest", hook: "Where each loan payment really goes." },
  { id: "expected", title: "Expected Value", hook: "Salary × the chance of a job." },
  { id: "inflation", title: "Inflation", hook: "What $100 buys over time." },
  { id: "human", title: "Human Capital", hook: "Skills as an investment that pays yearly." },
  { id: "risk", title: "Risk", hook: "Same average, different spread." },
  { id: "npv", title: "Net Present Value", hook: "What future money is worth today." },
];

/**
 * LEARN THE ECONOMICS. Eight concept cards; each expands (shared layout) into
 * a small working experiment built on the same calculation engine.
 */
export function Lessons({ data }: { data: LessonInputs }) {
  const [open, setOpen] = useState<LessonId | null>(null);
  const lesson = LESSONS.find((l) => l.id === open);
  return (
    <LayoutGroup>
      <ul className="grid auto-rows-[minmax(150px,auto)] gap-3 md:grid-cols-4">
        {LESSONS.map((l, i) => (
          <li key={l.id} className={cn(l.span)}>
            <motion.button
              layoutId={`lesson-${l.id}`}
              type="button"
              onClick={() => setOpen(l.id)}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.985 }}
              transition={{ duration: DUR.standard, ease: EASE.smooth }}
              className="group relative grid h-full w-full content-between gap-6 overflow-hidden rounded-lg border border-rule bg-surface p-5 text-left shadow-1 hover:shadow-3"
              data-cursor="EXPLORE"
            >
              <span className="flex items-start justify-between gap-3">
                <motion.span layoutId={`lesson-t-${l.id}`} className="text-h3 font-bold text-ink">
                  {l.title}
                </motion.span>
                <span className="tabular text-caption font-bold text-muted">{String(i + 1).padStart(2, "0")}</span>
              </span>
              <span className={cn("grid gap-3", l.span?.includes("row-span-2") && "self-end")}>
                <Glyph id={l.id} big={!!l.span?.includes("row-span-2")} />
                <span className="text-small text-ink-2">{l.hook}</span>
              </span>
            </motion.button>
          </li>
        ))}
      </ul>

      <Dialog.Root open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <AnimatePresence>
          {lesson && (
            <Dialog.Portal forceMount>
              <Dialog.Overlay asChild forceMount>
                <motion.div className="fixed inset-0 z-50 bg-[#0b1020]/60 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: DUR.fast } }} />
              </Dialog.Overlay>
              <Dialog.Content asChild forceMount aria-describedby={undefined}>
                {/* Flex-centered wrapper: the panel itself only carries the shared-layout transform. */}
                <div className="fixed inset-0 z-50 flex items-end justify-center p-3 pt-[calc(var(--nav-h)+12px)] sm:p-6 md:items-center" onClick={(e) => e.target === e.currentTarget && setOpen(null)}>
                  <motion.div
                    layoutId={`lesson-${lesson.id}`}
                    transition={{ duration: DUR.large, ease: EASE.smooth }}
                    className="grid max-h-full w-full max-w-[880px] content-start gap-5 overflow-y-auto rounded-lg border border-rule bg-surface p-5 shadow-3 sm:p-8 md:max-h-[86vh]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <Dialog.Title asChild>
                        <motion.h3 layoutId={`lesson-t-${lesson.id}`} className="text-h2 font-extrabold">
                          {lesson.title}
                        </motion.h3>
                      </Dialog.Title>
                      <Dialog.Close className="grid size-10 shrink-0 place-items-center rounded-full border border-rule text-ink-2 hover:text-ink" aria-label="Close lesson">
                        <X className="size-4" />
                      </Dialog.Close>
                    </div>
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: 0.2, duration: DUR.standard, ease: EASE.smooth }}>
                      <Experience id={lesson.id} data={data} />
                    </motion.div>
                  </motion.div>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          )}
        </AnimatePresence>
      </Dialog.Root>
    </LayoutGroup>
  );
}

function Glyph({ id, big }: { id: LessonId; big: boolean }) {
  const h = big ? 220 : 44;
  const round = id === "purchasing" || id === "npv";
  const common = { viewBox: "0 0 200 60", preserveAspectRatio: round ? "xMidYMid meet" : "none", className: "w-full", style: { height: h } } as const;
  switch (id) {
    case "opportunity":
      return (
        <svg {...common} aria-hidden>
          <path d="M0 50 H70" stroke="var(--ink)" strokeWidth="2" fill="none" vectorEffect="non-scaling-stroke" />
          <path d="M70 50 C110 50, 140 30, 200 4" stroke="var(--trace-a)" strokeWidth="2.5" fill="none" vectorEffect="non-scaling-stroke" className="transition-all duration-500 [stroke-dasharray:260] [stroke-dashoffset:120] group-hover:[stroke-dashoffset:0]" />
          <path d="M70 50 H200" stroke="var(--trace-c)" strokeWidth="2" strokeDasharray="6 4" fill="none" vectorEffect="non-scaling-stroke" />
        </svg>
      );
    case "purchasing":
      return (
        <svg {...common} aria-hidden>
          <circle cx="60" cy="30" r="24" fill="var(--trace-a-tint)" stroke="var(--trace-a)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          <circle cx="150" cy="30" r="17" fill="none" stroke="var(--ink)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" className="origin-[150px_30px] transition-transform duration-500 group-hover:scale-125" />
        </svg>
      );
    case "debt":
      return (
        <svg {...common} aria-hidden>
          {Array.from({ length: 10 }, (_, i) => (
            <g key={i}>
              <rect x={i * 20 + 2} y={60 - (10 - i) * 5} width="16" height={(10 - i) * 5} rx="2" fill="var(--ink)" opacity={0.75} />
            </g>
          ))}
        </svg>
      );
    case "expected":
      return (
        <svg {...common} aria-hidden>
          <path d="M0 55 C40 55, 60 8, 100 8 S160 55, 200 55" fill="var(--trace-b-tint)" stroke="var(--trace-b)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          <line x1="100" x2="100" y1="4" y2="58" stroke="var(--ink)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        </svg>
      );
    case "inflation":
      return (
        <svg {...common} aria-hidden>
          {[0, 1, 2, 3, 4].map((i) => (
            <rect key={i} x={i * 40 + 6} y={60 - (56 - i * 9)} width="28" height={56 - i * 9} rx="3" fill="var(--ink)" opacity={1 - i * 0.15} />
          ))}
        </svg>
      );
    case "human":
      return (
        <svg {...common} aria-hidden>
          <path d="M0 50 C60 45, 120 35, 200 30" stroke="var(--trace-c)" strokeWidth="2" strokeDasharray="6 4" fill="none" vectorEffect="non-scaling-stroke" />
          <path d="M0 55 C50 40, 110 18, 200 4" stroke="var(--trace-a)" strokeWidth="2.5" fill="none" vectorEffect="non-scaling-stroke" />
        </svg>
      );
    case "risk":
      return (
        <svg {...common} aria-hidden>
          <path d="M0 58 C60 58, 80 6, 100 6 S140 58, 200 58" fill="none" stroke="var(--ink)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          <path d="M0 58 C30 58, 50 30, 100 30 S170 58, 200 58" fill="none" stroke="var(--trace-d)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        </svg>
      );
    case "npv":
      return (
        <svg {...common} aria-hidden>
          {[0, 1, 2, 3, 4].map((i) => (
            <circle key={i} cx={20 + i * 40} cy={30} r={20 - i * 3.2} fill="none" stroke="var(--trace-a)" strokeWidth="2" vectorEffect="non-scaling-stroke" opacity={1 - i * 0.12} />
          ))}
        </svg>
      );
  }
}

// ------------------------------------------------------------------ experiences

function Experience({ id, data }: { id: LessonId; data: LessonInputs }) {
  switch (id) {
    case "opportunity":
      return <OpportunityLesson />;
    case "purchasing":
      return <PurchasingLesson data={data} />;
    case "debt":
      return <DebtLesson />;
    case "expected":
      return <ExpectedLesson data={data} />;
    case "inflation":
      return <InflationLesson />;
    case "human":
      return <HumanCapitalLesson data={data} />;
    case "risk":
      return <RiskLesson data={data} />;
    case "npv":
      return <NpvLesson />;
  }
}

function Lead({ children }: { children: React.ReactNode }) {
  return <p className="max-w-[60ch] text-lede text-ink-2">{children}</p>;
}

function Big({ label, value, fmt, tone }: { label: string; value: number; fmt: (v: number) => string; tone?: string }) {
  return (
    <div className="grid gap-0.5">
      <p className="text-caption font-bold tracking-[0.12em] text-muted">{label}</p>
      <p className="text-metric font-extrabold" style={tone ? { color: tone } : undefined}>
        <AnimatedNumber value={value} format={fmt} />
      </p>
    </div>
  );
}

function OpportunityLesson() {
  const [choice, setChoice] = useState<"spend" | "invest">("invest");
  const [ret, setRet] = useState(5);
  const [years, setYears] = useState(20);
  const series = compoundSeries(20000, ret / 100, years);
  const fv = series[series.length - 1];
  const [ref, W] = useMeasuredWidth<HTMLDivElement>(600);
  const H = 180;
  const x = linear([0, years], [8, W - 8]);
  const y = linear([0, Math.max(...series) * 1.05], [H - 8, 8]);
  return (
    <div className="grid gap-5">
      <Lead>You have $20,000. Spending it now has a price: everything it could have become. That forgone growth is the opportunity cost.</Lead>
      <Segmented label="Your choice" value={choice} onChange={setChoice} options={[{ value: "spend", label: "Spend now" }, { value: "invest", label: "Invest" }]} />
      <div className="grid gap-5 sm:grid-cols-2">
        <GraduatedSlider label="Annual return (assumed, after inflation)" value={ret} onChange={setRet} min={0} max={10} step={0.5} format={(v) => pct(v, 1)} trace="a" />
        <GraduatedSlider label="Years" value={years} onChange={setYears} min={1} max={40} step={1} format={(v) => `${v}`} trace="a" />
      </div>
      <div ref={ref}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="block max-w-full" role="img" aria-label={`$20,000 grows to ${money(fv)} in ${years} years at ${ret}%.`}>
          <line x1={8} x2={W - 8} y1={y(20000)} y2={y(20000)} stroke="var(--trace-c)" strokeDasharray="6 4" />
          <motion.path initial={false} animate={{ d: linePath(series.map((v, i) => [x(i), y(v)])), opacity: choice === "invest" ? 1 : 0.25 }} transition={{ duration: 0.35, ease: EASE.smooth }} fill="none" stroke="var(--trace-a)" strokeWidth={3} />
        </svg>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Big label={choice === "invest" ? `INVESTED FOR ${years} YEARS` : "SPENT TODAY"} value={choice === "invest" ? fv : 20000} fmt={money} />
        <Big label="OPPORTUNITY COST OF SPENDING" value={fv - 20000} fmt={money} tone="var(--trace-a)" />
      </div>
    </div>
  );
}

function PurchasingLesson({ data }: { data: LessonInputs }) {
  const [step, setStep] = useState(0);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) {
      const t = setTimeout(() => setStep(4), 0);
      return () => clearTimeout(t);
    }
    const t = setInterval(() => setStep((s) => (s >= 4 ? s : s + 1)), 650);
    return () => clearInterval(t);
  }, [reduce]);
  const cities = [data.sf, data.cle].map((c) => ({ ...c, d: calculateDisposableIncome({ salary: 100000, stateRate: c.tax, rentPerMonth: c.rent, rpp: c.rpp }) }));
  return (
    <div className="grid gap-5">
      <Lead>Same $100,000 offer, two cities. Watch taxes, rent and everyday costs come out of each; what&apos;s left is what the salary is really worth.</Lead>
      <div className="grid gap-4 sm:grid-cols-2">
        {cities.map((c) => {
          const parts: Array<[string, number]> = [["Taxes", c.d.taxes], ["Rent (1-bedroom)", c.d.rent], ["Core living costs", c.d.core]];
          const left = 100000 - parts.slice(0, step).reduce((s, [, v]) => s + (v as number), 0);
          return (
            <div key={c.name} className="grid gap-3 rounded-md border border-rule p-4">
              <p className="text-caption font-bold tracking-[0.12em] text-muted">{c.name.toUpperCase()}</p>
              <p className="text-h2 font-extrabold">$100K</p>
              <ul className="grid gap-1.5">
                {parts.map(([label, v], i) => (
                  <motion.li key={label} initial={false} animate={{ opacity: i < step ? 1 : 0.25, x: i < step ? 0 : -6 }} transition={{ duration: DUR.standard, ease: EASE.smooth }} className="flex justify-between text-small">
                    <span className="text-ink-2">{label}</span>
                    <span className="tabular font-semibold text-ink">−{money(v)}</span>
                  </motion.li>
                ))}
              </ul>
              <div className="h-3 overflow-hidden rounded-full bg-surface-sunk">
                <motion.div className="h-full origin-left rounded-full bg-trace-a" initial={false} animate={{ scaleX: Math.max(0, left) / 100000 }} transition={{ duration: DUR.large, ease: EASE.smooth }} />
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-caption text-muted">{step >= 4 ? "Disposable income" : "Left so far"}</span>
                <span className="tabular text-h3 font-bold">
                  <AnimatedNumber value={step >= 3 ? c.d.disposable : left} format={money} />
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-caption text-muted">Core costs: {money(20400)} a year at US-average prices, scaled by each city&apos;s price level (sample assumption). State and federal income taxes, 2024.</p>
    </div>
  );
}

function DebtLesson() {
  const principal = 20000;
  const rate = 6;
  const sched = loanSchedule(principal, rate, 10);
  const payment = calculateLoanPayment(principal, rate, 10);
  const [year, setYear] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const stop = () => {
    if (timer.current) clearInterval(timer.current);
    setPlaying(false);
  };
  const play = () => {
    if (playing) return stop();
    let y = year >= 10 ? 0 : year;
    setYear(y);
    setPlaying(true);
    timer.current = setInterval(() => {
      y += 1;
      setYear(y);
      if (y >= 10) stop();
    }, 600);
  };
  useEffect(() => () => stop(), []);
  const paidInterest = sched.slice(1, year + 1).reduce((s, p) => s + p.interestPaid, 0);
  const maxYear = Math.max(...sched.slice(1).map((p) => p.interestPaid + p.principalPaid));
  return (
    <div className="grid gap-5">
      <Lead>
        A $20,000 loan at 6% over 10 years costs {money(payment)} a month. Early payments are mostly interest; later ones mostly pay down what you owe. Total interest: {money(payment * 120 - principal)}.
      </Lead>
      <div className="flex items-center gap-3">
        <button type="button" onClick={play} className="flex h-11 items-center gap-2 rounded-sm bg-ink px-4 text-small font-semibold text-on-ink">
          {playing ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />}
          {playing ? "Pause" : year >= 10 ? "Replay" : "Play 10 years"}
        </button>
        <span className="tabular text-small text-ink-2">Year {year} of 10</span>
      </div>
      <div className="flex h-40 items-end gap-1.5" role="img" aria-label="Each year's payments split into principal and interest">
        {sched.slice(1).map((p, i) => {
          const tot = p.interestPaid + p.principalPaid;
          const on = i < year;
          return (
            <div key={i} className="flex h-full flex-1 flex-col justify-end">
              <motion.div initial={false} animate={{ opacity: on ? 1 : 0.2 }} className="flex flex-col overflow-hidden rounded-t-[4px]" style={{ height: `${(tot / maxYear) * 100}%` }}>
                <div className="aid-hatch" style={{ height: `${(p.interestPaid / tot) * 100}%` }} />
                <div className="flex-1 bg-trace-a" />
              </motion.div>
            </div>
          );
        })}
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Big label="STILL OWED" value={sched[year].balance} fmt={money} />
        <Big label="INTEREST PAID" value={paidInterest} fmt={money} />
        <div className="grid content-end gap-1 text-caption text-ink-2">
          <span className="flex items-center gap-2"><span className="size-3 rounded-[3px] bg-trace-a" />Principal</span>
          <span className="flex items-center gap-2"><span className="aid-hatch size-3 rounded-[3px] border border-ink" />Interest</span>
        </div>
      </div>
    </div>
  );
}

function ExpectedLesson({ data }: { data: LessonInputs }) {
  const [p, setP] = useState(Math.round(data.econ.employment));
  const salary = data.econ.p.p50;
  return (
    <div className="grid gap-5">
      <Lead>A salary only counts if you have the job. Expected value multiplies each outcome by its chance. For a typical {data.econ.name.toLowerCase()} graduate:</Lead>
      <GraduatedSlider label="Chance of being employed" value={p} onChange={setP} min={50} max={100} step={1} format={(v) => pct(v)} trace="b" />
      <div className="grid gap-4 sm:grid-cols-3">
        <Big label="MEDIAN SALARY" value={salary} fmt={money} />
        <Big label="× CHANCE OF A JOB" value={p} fmt={(v) => pct(v)} />
        <Big label="= EXPECTED EARNINGS" value={(salary * p) / 100} fmt={money} tone="var(--trace-b)" />
      </div>
      <p className="text-caption text-muted">College Value Lab uses expected earnings (salary × employment rate) in every projection. Default: this major&apos;s sample employment rate.</p>
    </div>
  );
}

function InflationLesson() {
  const [rate, setRate] = useState(2.5);
  const [years, setYears] = useState(20);
  const real = adjustForInflation(100, years, rate / 100);
  return (
    <div className="grid gap-5">
      <Lead>Prices rise, so money buys less over time. This is why the site shows everything in constant 2024 dollars.</Lead>
      <div className="grid gap-5 sm:grid-cols-2">
        <GraduatedSlider label="Inflation per year" value={rate} onChange={setRate} min={0} max={8} step={0.5} format={(v) => pct(v, 1)} />
        <GraduatedSlider label="Years from now" value={years} onChange={setYears} min={0} max={40} step={1} format={(v) => `${v}`} />
      </div>
      <div className="grid grid-cols-2 items-end gap-6">
        {[["Today", 100], [`In ${years} years`, real]].map(([label, v]) => (
          <div key={label as string} className="grid gap-2">
            <div className="flex h-44 items-end">
              <motion.div className="w-full origin-bottom rounded-t-md bg-trace-a" initial={false} animate={{ scaleY: (v as number) / 100 }} transition={{ duration: DUR.large, ease: EASE.smooth }} style={{ height: "100%" }} />
            </div>
            <p className="text-caption text-muted">{label}</p>
            <p className="tabular text-h2 font-extrabold">
              <AnimatedNumber value={v as number} format={money} />
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function HumanCapitalLesson({ data }: { data: LessonInputs }) {
  const [ref, W] = useMeasuredWidth<HTMLDivElement>(600);
  const H = 190;
  const years = 22;
  const grad = [...Array(4).fill(0), ...projectSalary({ start: data.gradStart, midCareer: data.gradMid, years: years - 4 })];
  const hs = projectSalary({ start: NO_COLLEGE.startSalary, midCareer: NO_COLLEGE.midCareer, years });
  const x = linear([18, 18 + years - 1], [8, W - 8]);
  const y = linear([0, Math.max(...grad, ...hs) * 1.05], [H - 8, 8]);
  const premium = grad.reduce((s, v, i) => s + v - hs[i], 0);
  return (
    <div className="grid gap-5">
      <Lead>Education is an investment in yourself: you give up earnings now for higher earnings every year after. Economists call those skills human capital.</Lead>
      <div ref={ref}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="block max-w-full" role="img" aria-label="Yearly earnings with and without a degree">
          <path d={linePath(hs.map((v, i) => [x(18 + i), y(v)]))} fill="none" stroke="var(--trace-c)" strokeWidth={2} strokeDasharray="6 4" />
          <motion.path initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: DUR.hero, ease: EASE.smooth }} d={linePath(grad.map((v, i) => [x(18 + i), y(v)]))} fill="none" stroke="var(--trace-a)" strokeWidth={3} />
        </svg>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Big label="START, NO DEGREE" value={NO_COLLEGE.startSalary} fmt={money} />
        <Big label="START, BACHELOR'S (MEDIAN)" value={data.gradStart} fmt={money} />
        <Big label="EXTRA EARNINGS BY 39" value={premium} fmt={moneyCompact} tone="var(--trace-a)" />
      </div>
      <p className="text-caption text-muted">Before tax and before college costs; sample medians across majors. Earnings differences also reflect who goes to college (selection), not only what college teaches.</p>
    </div>
  );
}

function RiskLesson({ data }: { data: LessonInputs }) {
  const [spread, setSpread] = useState(1);
  const p = data.econ.p;
  const mid = p.p50;
  const lo = mid - (mid - p.p10) * spread;
  const hi = mid + (p.p90 - mid) * spread;
  return (
    <div className="grid gap-5">
      <Lead>Two options can share the same typical outcome and still carry very different risk. Risk is the width of the range, not the middle of it.</Lead>
      <GraduatedSlider label="How spread out outcomes are" value={spread} onChange={setSpread} min={0.2} max={2} step={0.1} format={(v) => `${v.toFixed(1)}×`} trace="d" />
      <div className="relative h-20 rounded-md bg-surface-sunk">
        <motion.div className="absolute inset-y-6 rounded-full bg-trace-d-tint ring-2 ring-trace-d" initial={false} animate={{ left: `${(Math.max(0, lo) / 250000) * 100}%`, right: `${100 - (Math.min(250000, hi) / 250000) * 100}%` }} transition={{ duration: DUR.standard, ease: EASE.smooth }} />
        <div className="absolute inset-y-3 w-0.5 bg-ink" style={{ left: `${(mid / 250000) * 100}%` }} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Big label="LOWER OUTCOME (10TH)" value={Math.max(0, lo)} fmt={money} />
        <Big label="TYPICAL (MEDIAN)" value={mid} fmt={money} />
        <Big label="HIGHER OUTCOME (90TH)" value={hi} fmt={money} />
      </div>
    </div>
  );
}

function NpvLesson() {
  const [years, setYears] = useState(10);
  const [rate, setRate] = useState(3);
  const pv = 10000 / Math.pow(1 + rate / 100, years);
  return (
    <div className="grid gap-5">
      <Lead>A dollar later is worth less than a dollar now, because a dollar now can be invested. Net present value discounts future money back to today.</Lead>
      <div className="grid gap-5 sm:grid-cols-2">
        <GraduatedSlider label="Years until you receive $10,000" value={years} onChange={setYears} min={0} max={40} step={1} format={(v) => `${v}`} trace="a" />
        <GraduatedSlider label="Discount rate" value={rate} onChange={setRate} min={0} max={10} step={0.5} format={(v) => pct(v, 1)} trace="a" />
      </div>
      <div className="grid grid-cols-2 items-center gap-6">
        <div className="grid justify-items-center gap-2">
          <div className="grid size-40 place-items-center rounded-full border-2 border-ink">
            <span className="text-h3 font-bold">$10,000</span>
          </div>
          <p className="text-caption text-muted">In {years} years</p>
        </div>
        <div className="grid justify-items-center gap-2">
          <motion.div className="grid place-items-center rounded-full border-2 border-trace-a bg-trace-a-tint" initial={false} animate={{ width: 160 * Math.sqrt(pv / 10000), height: 160 * Math.sqrt(pv / 10000) }} transition={{ duration: DUR.large, ease: EASE.smooth }}>
            <span className="tabular text-small font-bold">{moneyCompact(pv)}</span>
          </motion.div>
          <p className="text-caption text-muted">Worth today</p>
        </div>
      </div>
      <p className="text-caption text-muted">College Value Lab discounts at 3% a year where it compares money across time.</p>
    </div>
  );
}
