"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Popover } from "radix-ui";
import { useRef, useState } from "react";
import { AnimatedNumber, useFinePointer } from "@/components/motion";
import { adjustForCostOfLiving, adjustForInflation, compoundSeries } from "@/lib/calc";
import { growWidth, pop } from "@/lib/animations";
import { money, pct } from "@/lib/format";
import { cn } from "@/lib/cn";

/**
 * Economics concept tooltips. Hover (desktop) or tap a term to open a tiny
 * working example instead of a dictionary definition. Every example runs
 * the same pure functions as the rest of the site, with its assumption shown.
 */
export type ConceptId = "opportunity-cost" | "npv" | "purchasing-power" | "expected-value" | "debt-burden" | "real-income" | "inflation";

const TITLES: Record<ConceptId, string> = {
  "opportunity-cost": "Opportunity cost",
  npv: "Net present value",
  "purchasing-power": "Purchasing power",
  "expected-value": "Expected value",
  "debt-burden": "Debt burden",
  "real-income": "Real income",
  inflation: "Inflation",
};

export function Concept({ id, children }: { id: ConceptId; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const fine = useFinePointer();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hover = (next: boolean) => {
    if (!fine) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(next), next ? 180 : 220);
  };
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        className="cursor-help rounded-xs text-inherit underline decoration-ink/40 decoration-dotted decoration-[1.5px] underline-offset-[5px] hover:decoration-ink"
        onPointerEnter={() => hover(true)}
        onPointerLeave={() => hover(false)}
      >
        {children}
      </Popover.Trigger>
      <AnimatePresence>
        {open && (
          <Popover.Portal forceMount>
            <Popover.Content
              forceMount
              asChild
              side="top"
              align="center"
              sideOffset={8}
              collisionPadding={16}
              onPointerEnter={() => hover(true)}
              onPointerLeave={() => hover(false)}
              aria-label={TITLES[id]}
            >
              <motion.div variants={pop} initial="hidden" animate="visible" exit="exit" className="z-50 grid w-[min(20rem,calc(100vw-32px))] gap-3 rounded-md border border-rule bg-surface p-4 text-left text-small font-normal tracking-normal text-ink-2 shadow-3">
                <p className="text-small font-semibold text-ink">{TITLES[id]}</p>
                <Example id={id} />
              </motion.div>
            </Popover.Content>
          </Popover.Portal>
        )}
      </AnimatePresence>
    </Popover.Root>
  );
}

function Example({ id }: { id: ConceptId }) {
  switch (id) {
    case "opportunity-cost":
      return <OpportunityCost />;
    case "npv":
      return <Npv />;
    case "purchasing-power":
      return <PurchasingPower />;
    case "expected-value":
      return <ExpectedValue />;
    case "debt-burden":
      return <DebtBurden />;
    case "real-income":
      return <RealIncome />;
    case "inflation":
      return <Inflation />;
  }
}

/** Assumed real (after-inflation) return for the "invested instead" example. */
const REAL_RETURN = 0.05;

function OpportunityCost() {
  const [shown, setShown] = useState(false);
  const grown = compoundSeries(20000, REAL_RETURN, 10)[10];
  return (
    <div className="grid gap-3">
      <p>The value of the best thing you give up. You spend <strong className="text-ink">$20,000</strong> today.</p>
      <Bars rows={[["Spent today", 20000], ...(shown ? ([["Invested for 10 years", grown]] as Array<[string, number]>) : [])]} max={grown} />
      {shown ? (
        <p className="text-caption text-muted">At an assumed {pct(REAL_RETURN * 100)} real return a year. That {money(grown - 20000)} is part of what the purchase really cost.</p>
      ) : (
        <MiniButton onClick={() => setShown(true)}>See what happens if it were invested instead</MiniButton>
      )}
    </div>
  );
}

function Npv() {
  const [years, setYears] = useState(10);
  const rate = 0.03;
  const pv = 10000 / Math.pow(1 + rate, years);
  return (
    <div className="grid gap-3">
      <p>What future money is worth today. $10,000 arriving in <strong className="text-ink">{years} years</strong> is worth</p>
      <p className="text-h3 font-semibold text-ink">
        <AnimatedNumber value={pv} format={money} /> <span className="text-small font-normal text-muted">today</span>
      </p>
      <MiniRange label="Years away" value={years} min={0} max={30} onChange={setYears} />
      <p className="text-caption text-muted">Discounted at 3% a year, the rate College Value Lab uses.</p>
    </div>
  );
}

function PurchasingPower() {
  const [level, setLevel] = useState(118);
  const real = adjustForCostOfLiving(100000, level);
  return (
    <div className="grid gap-3">
      <p>What your money actually buys. A $100,000 salary where prices are <strong className="text-ink">{level - 100 >= 0 ? `${level - 100}% above` : `${100 - level}% below`}</strong> average buys what</p>
      <p className="text-h3 font-semibold text-ink">
        <AnimatedNumber value={real} format={money} />
      </p>
      <p>buys in an average-priced place.</p>
      <MiniRange label="Local price level" value={level} min={85} max={125} onChange={setLevel} />
    </div>
  );
}

function ExpectedValue() {
  const [pHigh, setPHigh] = useState(25);
  const pLow = 25;
  const pMid = 100 - pHigh - pLow;
  const outcomes: Array<[string, number, number]> = [["Low", 50000, pLow], ["Middle", 80000, pMid], ["High", 130000, pHigh]];
  const ev = outcomes.reduce((s, [, v, p]) => s + (v * p) / 100, 0);
  return (
    <div className="grid gap-3">
      <p>Each outcome times its chance, added up. Three possible starting salaries:</p>
      <ul className="grid gap-1 text-caption">
        {outcomes.map(([l, v, p]) => (
          <li key={l} className="flex justify-between">
            <span>{l}: {money(v)}</span>
            <span className="tabular font-semibold text-ink">{p}% chance</span>
          </li>
        ))}
      </ul>
      <p>
        Expected value: <strong className="text-ink"><AnimatedNumber value={ev} format={money} /></strong>
      </p>
      <MiniRange label="Chance of the high outcome" value={pHigh} min={0} max={75} onChange={setPHigh} suffix="%" />
      <p className="text-caption text-muted">An average over many possible futures, not a promise for one.</p>
    </div>
  );
}

function DebtBurden() {
  const [salary, setSalary] = useState(60000);
  const payment = 580;
  const share = ((payment * 12) / salary) * 100;
  return (
    <div className="grid gap-3">
      <p>Loan payments as a share of income. A <strong className="text-ink">{money(payment)}/month</strong> payment on a {money(salary)} salary takes</p>
      <p className="text-h3 font-semibold text-ink">
        <AnimatedNumber value={share} format={(v) => pct(v, 1)} /> <span className="text-small font-normal text-muted">of gross pay</span>
      </p>
      <MiniRange label="Salary" value={salary} min={30000} max={120000} step={5000} onChange={setSalary} format={money} />
      <p className="text-caption text-muted">A common rule of thumb keeps student-loan payments under about 10% of gross income.</p>
    </div>
  );
}

function RealIncome() {
  const [raise, setRaise] = useState(3);
  const inflation = 2.5;
  const real = ((1 + raise / 100) / (1 + inflation / 100) - 1) * 100;
  return (
    <div className="grid gap-3">
      <p>Income after adjusting for rising prices. A <strong className="text-ink">{raise}% raise</strong> with {inflation}% inflation is a real raise of</p>
      <p className={cn("text-h3 font-semibold", real < 0 ? "text-risk" : "text-ink")}>
        <AnimatedNumber value={real} format={(v) => `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(1)}%`} />
      </p>
      <MiniRange label="Your raise" value={raise} min={0} max={8} step={0.5} onChange={setRaise} suffix="%" />
      <p className="text-caption text-muted">College Value Lab shows everything in 2024 dollars, so every number here is already real.</p>
    </div>
  );
}

function Inflation() {
  const [years, setYears] = useState(10);
  const v = adjustForInflation(100, years, 0.025);
  return (
    <div className="grid gap-3">
      <p>Prices rising over time. In <strong className="text-ink">{years} years</strong>, $100 will buy what</p>
      <Bars rows={[["Today", 100], [`In ${years} years`, v]]} max={100} fmt={money} />
      <p>buys today, at 2.5% inflation a year.</p>
      <MiniRange label="Years" value={years} min={0} max={40} onChange={setYears} />
    </div>
  );
}

// ---------------------------------------------------------------- tiny controls

function Bars({ rows, max, fmt = money }: { rows: Array<[string, number]>; max: number; fmt?: (v: number) => string }) {
  return (
    <ul className="grid gap-1.5">
      {rows.map(([label, v], i) => (
        <li key={label} className="grid gap-1">
          <span className="flex justify-between text-caption">
            <span>{label}</span>
            <span className="tabular font-semibold text-ink">{fmt(v)}</span>
          </span>
          <span className="h-2 rounded-full bg-surface-sunk">
            <motion.span className="block h-full rounded-full" style={{ background: i ? "var(--trace-a)" : "var(--ink)" }} variants={growWidth} custom={`${(v / max) * 100}%`} initial="hidden" animate="visible" />
          </span>
        </li>
      ))}
    </ul>
  );
}

function MiniRange({ label, value, min, max, step = 1, onChange, suffix = "", format }: { label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; suffix?: string; format?: (v: number) => string }) {
  return (
    <label className="grid gap-1 text-caption">
      <span className="flex justify-between">
        <span>{label}</span>
        <span className="tabular font-semibold text-ink">{format ? format(value) : `${value}${suffix}`}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="h-6 w-full cursor-pointer accent-[var(--ink)]" />
    </label>
  );
}

function MiniButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={onClick} className="min-h-10 rounded-sm border border-rule-strong bg-surface px-3 py-2 text-left text-caption font-semibold text-ink hover:border-ink">
      {children}
    </motion.button>
  );
}
