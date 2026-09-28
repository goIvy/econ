"use client";

import { AnimatePresence, LayoutGroup, motion, useMotionValue, useSpring, useTransform, useVelocity } from "framer-motion";
import { Bookmark, BookmarkCheck, GripVertical, Plus, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatedNumber, useFinePointer } from "@/components/motion";
import { ButtonLink } from "@/components/ui/button";
import { ConfidenceBadge, SampleChip } from "@/components/ui/lineage";
import { linear, linePath } from "@/components/charts/scale";
import { calculateBreakEvenYear, cumulativeSeries, projectNoCollege, projectPath, tuitionFor, type PathContext } from "@/lib/calc";
import { DUR, EASE, slotSpring } from "@/lib/animations";
import { money, moneyCompact, pct } from "@/lib/format";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useSaved } from "@/hooks/use-saved";
import { cn } from "@/lib/cn";
import type { Residency } from "@/types";
import type { TrayCard } from "./data";

const MAX = 4;
const FUNDING = { scholarshipsPerYear: 0, familyPerYear: 10000, workPerYear: 3000, savings: 0 };
type Category = "cost" | "career" | "risk" | "long";
const CATS: Array<{ id: Category; label: string }> = [
  { id: "cost", label: "COST" },
  { id: "career", label: "CAREER" },
  { id: "risk", label: "RISK" },
  { id: "long", label: "LONG TERM" },
];
const BASELINE = projectNoCollege({ horizonAge: 40 });

interface Metrics {
  tuition: number;
  net4: number;
  debt: number;
  monthly: number;
  salary: number;
  employment: number;
  year10: number;
  mid: number;
  grad6: number;
  grad4: number;
  spread: [number, number];
  confidence: string;
  breakEven: number | null;
  at40: number;
  series: number[];
}

function compute(ctx: PathContext, aid: number, residency: Residency): Metrics {
  const res: Residency = ctx.college.control === "public" ? residency : "resident";
  const r = projectPath({ collegeId: ctx.college.id, majorId: ctx.major.id, residency: res, living: "campus", yearsToGraduate: 4, funding: { ...FUNDING, aidPerYear: aid } }, ctx, { horizonAge: 40 });
  const be = calculateBreakEvenYear(r.rows, BASELINE, r.graduationAge);
  const p = ctx.outcome.earlyCareer.value ?? ctx.major.earlyCareer.value;
  const series = cumulativeSeries(r.rows, 40);
  return {
    tuition: tuitionFor(ctx.college, res),
    net4: r.net.netPrice,
    debt: r.net.borrowing,
    monthly: r.loan.monthlyPayment,
    salary: r.startingSalary,
    employment: r.employmentRate * 100,
    year10: r.tenYearEarnings,
    mid: ctx.outcome.midCareerMedian.value ?? ctx.major.midCareerMedian.value ?? 0,
    grad6: ctx.college.gradRate6.value ?? 0,
    grad4: ctx.college.gradRate4.value ?? 0,
    spread: [p?.p10 ?? 0, p?.p90 ?? 0],
    confidence: ctx.outcome.earlyCareer.lineage.confidence,
    breakEven: be && be.age > 18 ? be.age : null,
    at40: series[series.length - 1],
    series,
  };
}

/**
 * COLLEGE COMPARISON. Drag cards (or press + / Enter) onto the stage. Staged
 * cards expand, show their major and residency, and reveal metrics for the
 * chosen lens: cost, career, risk or long term. Nothing is ranked.
 */
export function CompareStage({ cards }: { cards: TrayCard[] }) {
  const [staged, setStaged] = useState<string[]>([]);
  const [residency, setResidency] = useState<Record<string, Residency>>({});
  const [cat, setCat] = useState<Category>("cost");
  const [over, setOver] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const fine = useFinePointer();
  const reduce = useReducedMotion();
  const { save, isSaved } = useSaved();

  const add = (id: string) => setStaged((s) => (s.includes(id) || s.length >= MAX ? s : [...s, id]));
  const remove = (id: string) => setStaged((s) => s.filter((x) => x !== id));
  const inStage = (x: number, y: number) => {
    const r = stageRef.current?.getBoundingClientRect();
    return !!r && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  };
  const tray = cards.filter((c) => !staged.includes(c.id));
  const chosen = staged.map((id) => cards.find((c) => c.id === id)!);
  const full = staged.length >= MAX;
  const href = `/compare?p=${chosen.map((c) => `${c.id}.${(residency[c.id] ?? "resident") === "resident" ? "r" : "n"}.c.${c.aid}`).join(",")}`;
  const saved = chosen.length > 0 && isSaved(href);

  return (
    <LayoutGroup>
      <div className="grid gap-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-small text-ink-2">{fine ? "Drag a college onto the stage, or press its + button." : "Tap + to put a college on the stage."} Up to four.</p>
          <SampleChip />
        </div>

        <ul className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-3 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0" aria-label="Colleges you can compare">
          <AnimatePresence initial={false} mode="popLayout">
            {tray.map((c) => (
              <TrayItem key={c.id} card={c} disabled={full} draggable={fine && !reduce && !full} onAdd={() => add(c.id)} onDragOver={setOver} inStage={inStage} />
            ))}
          </AnimatePresence>
        </ul>

        <div
          ref={stageRef}
          role="region"
          aria-label="Comparison stage"
          className={cn("relative grid gap-5 rounded-lg border-2 border-dashed p-3 transition-colors duration-300 sm:p-5", over ? "border-trace-a bg-trace-a-tint" : "border-rule-strong bg-surface-sunk/60")}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-caption font-bold tracking-[0.16em] text-muted">
              COMPARE STAGE <span className="tabular font-medium tracking-normal">({staged.length}/{MAX})</span>
            </p>
            <AnimatePresence>
              {chosen.length >= 2 && (
                <motion.div key="tabs" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} role="tablist" aria-label="Compare by" className="flex flex-wrap gap-1 rounded-full border border-rule bg-surface p-1">
                  {CATS.map((c) => (
                    <button key={c.id} role="tab" aria-selected={cat === c.id} onClick={() => setCat(c.id)} className={cn("relative rounded-full px-3 py-1.5 text-[11px] font-bold tracking-[0.12em] transition-colors", cat === c.id ? "text-on-ink" : "text-muted hover:text-ink")}>
                      {cat === c.id && <motion.span layoutId="cat-pill" className="absolute inset-0 rounded-full bg-ink" transition={{ duration: 0.3, ease: EASE.smooth }} />}
                      <span className="relative">{c.label}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: MAX }, (_, i) => {
              const c = chosen[i];
              return (
                <li key={c?.id ?? `slot-${i}`} className="min-h-[300px]">
                  {c ? (
                    <motion.div layoutId={c.id} transition={slotSpring} className="h-full">
                      <StagedCard card={c} slot={i} cat={cat} residency={residency[c.id] ?? "resident"} setResidency={(r) => setResidency((m) => ({ ...m, [c.id]: r }))} onRemove={() => remove(c.id)} />
                    </motion.div>
                  ) : (
                    <EmptySlot i={i} onSuggest={i === 0 && staged.length === 0 ? () => setStaged(cards.slice(0, 3).map((x) => x.id)) : undefined} />
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <ButtonLink href={chosen.length ? href : "/compare"} variant="secondary">
            Open full comparison
          </ButtonLink>
          <button
            type="button"
            disabled={!chosen.length}
            onClick={() => save({ label: chosen.map((c) => c.ctx.college.shortName).join(" vs "), href, paths: chosen.map((c) => `${c.ctx.college.shortName} ${c.ctx.major.name}`) })}
            className="flex h-11 items-center gap-2 rounded-sm px-4 text-small font-semibold text-ink-2 hover:bg-surface hover:text-ink disabled:opacity-40"
          >
            {saved ? <BookmarkCheck className="size-4 text-trace-a" aria-hidden /> : <Bookmark className="size-4" aria-hidden />}
            {saved ? "Saved" : "Save comparison"}
          </button>
        </div>
      </div>
    </LayoutGroup>
  );
}

function TrayItem({ card, disabled, draggable, onAdd, onDragOver, inStage }: { card: TrayCard; disabled: boolean; draggable: boolean; onAdd: () => void; onDragOver: (o: boolean) => void; inStage: (x: number, y: number) => boolean }) {
  const x = useMotionValue(0);
  const vx = useVelocity(x);
  // Tilt follows horizontal drag speed, settling back when the card slows.
  const rotate = useSpring(useTransform(vx, [-1600, 0, 1600], [-7, 0, 7], { clamp: true }), { stiffness: 300, damping: 25 });
  const c = card.ctx;
  return (
    <motion.li
      layoutId={card.id}
      transition={slotSpring}
      className="w-[210px] shrink-0 snap-start md:w-auto"
      drag={draggable}
      dragSnapToOrigin
      dragElastic={0.5}
      style={{ x, rotate, touchAction: draggable ? "none" : "pan-x" }}
      whileDrag={{ scale: 1.035, zIndex: 40, boxShadow: "var(--shadow-3)" }}
      onDrag={(_, i) => onDragOver(inStage(i.point.x - window.scrollX, i.point.y - window.scrollY))}
      onDragEnd={(_, i) => {
        onDragOver(false);
        if (inStage(i.point.x - window.scrollX, i.point.y - window.scrollY)) onAdd();
      }}
      data-cursor={draggable ? "DRAG" : undefined}
    >
      <div className="group flex h-full items-start gap-2 rounded-md border border-rule bg-surface p-3.5 shadow-1 transition-shadow hover:shadow-2">
        <GripVertical className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
        <div className="grid min-w-0 flex-1 gap-0.5">
          <p className="truncate text-[0.95rem] font-bold uppercase tracking-[0.02em] text-ink">{c.college.shortName}</p>
          <p className="truncate text-caption text-ink-2">{c.major.name}</p>
          <p className="text-[0.75rem] text-muted">
            {c.college.control === "public" ? "Public" : "Private"}, {c.college.state}
          </p>
        </div>
        <motion.button type="button" whileTap={{ scale: 0.9 }} onPointerDownCapture={(e) => e.stopPropagation()} onClick={onAdd} disabled={disabled} aria-label={`Add ${c.college.shortName} ${c.major.name} to the comparison`} className="grid size-9 shrink-0 place-items-center rounded-full border border-rule-strong text-ink hover:border-ink disabled:opacity-40">
          <Plus className="size-4" />
        </motion.button>
      </div>
    </motion.li>
  );
}

function StagedCard({ card, slot, cat, residency, setResidency, onRemove }: { card: TrayCard; slot: number; cat: Category; residency: Residency; setResidency: (r: Residency) => void; onRemove: () => void }) {
  const c = card.ctx;
  // Residency travels through the model in sequence: tuition now, debt at 300ms, break-even at 500ms.
  const [resDebt, setResDebt] = useState(residency);
  const [resBE, setResBE] = useState(residency);
  const reduce = useReducedMotion();
  useEffect(() => {
    const t1 = setTimeout(() => setResDebt(residency), reduce ? 0 : 300);
    const t2 = setTimeout(() => setResBE(residency), reduce ? 0 : 500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [residency, reduce]);
  const mNow = useMemo(() => compute(c, card.aid, residency), [c, card.aid, residency]);
  const mDebt = useMemo(() => compute(c, card.aid, resDebt), [c, card.aid, resDebt]);
  const mBE = useMemo(() => compute(c, card.aid, resBE), [c, card.aid, resBE]);

  const rows: Record<Category, Array<{ label: string; value: number | null; fmt: (v: number) => string; kind?: string; extra?: React.ReactNode }>> = {
    cost: [
      { label: "Tuition / yr", value: mNow.tuition, fmt: money },
      { label: "Net cost, 4 yrs", value: mDebt.net4, fmt: money },
      { label: "Debt", value: mDebt.debt, fmt: money },
      { label: "Monthly payment", value: mDebt.monthly, fmt: money },
    ],
    career: [
      { label: "Starting salary", value: mNow.salary, fmt: money },
      { label: "Employed", value: mNow.employment, fmt: (v) => pct(v) },
      { label: "Year-10 earnings", value: mNow.year10, fmt: moneyCompact },
      { label: "Mid-career median", value: mNow.mid, fmt: money },
    ],
    risk: [
      { label: "Graduate in 6 yrs", value: mNow.grad6, fmt: (v) => pct(v) },
      { label: "Graduate in 4 yrs", value: mNow.grad4, fmt: (v) => pct(v) },
      { label: "Salary range", value: null, fmt: money, extra: <span className="tabular">{moneyCompact(mNow.spread[0])}–{moneyCompact(mNow.spread[1])}</span> },
      { label: "Data", value: null, fmt: money, extra: <ConfidenceBadge level={mNow.confidence as "high"} /> },
    ],
    long: [
      { label: "Break-even age", value: mBE.breakEven, fmt: (v) => v.toFixed(1) },
      { label: "Net value at 40", value: mBE.at40, fmt: moneyCompact },
      { label: "Debt", value: mDebt.debt, fmt: moneyCompact },
      { label: "Year-10 earnings", value: mNow.year10, fmt: moneyCompact },
    ],
  };

  return (
    <div className="flex h-full flex-col gap-3 rounded-md border border-rule bg-surface p-4 shadow-3">
      <div className="flex items-start justify-between gap-2">
        <div className="grid min-w-0 gap-0.5">
          <p className="text-[10px] font-bold tracking-[0.16em] text-muted">OPTION {String(slot + 1).padStart(2, "0")}</p>
          <p className="truncate text-h3 font-bold uppercase tracking-[0.01em] text-ink">{c.college.shortName}</p>
          <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="truncate text-small text-ink-2">
            {c.major.name}
          </motion.p>
        </div>
        <button type="button" onClick={onRemove} aria-label={`Remove ${c.college.shortName}`} className="grid size-8 shrink-0 place-items-center rounded-full text-muted hover:bg-surface-sunk hover:text-ink">
          <X className="size-4" />
        </button>
      </div>

      {c.college.control === "public" ? (
        <div role="radiogroup" aria-label={`${c.college.shortName} residency`} className="grid grid-cols-2 rounded-full border border-rule bg-surface-sunk p-0.5 text-[10px] font-bold tracking-[0.06em]">
          {(["resident", "nonresident"] as const).map((r) => (
            <button key={r} role="radio" aria-checked={residency === r} onClick={() => setResidency(r)} className={cn("relative rounded-full px-2 py-1.5", residency === r ? "text-on-ink" : "text-muted")}>
              {residency === r && <motion.span layoutId={`res-${card.id}`} className="absolute inset-0 rounded-full bg-ink" transition={{ duration: 0.3, ease: EASE.smooth }} />}
              <span className="relative whitespace-nowrap">{r === "resident" ? "IN-STATE" : "OUT-OF-STATE"}</span>
            </button>
          ))}
        </div>
      ) : (
        <p className="rounded-full border border-rule px-3 py-1.5 text-center text-[11px] font-bold tracking-[0.1em] text-muted">PRIVATE · ONE PRICE</p>
      )}

      <div className="relative min-h-[150px] overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.dl key={cat} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18, transition: { duration: DUR.fast, ease: EASE.exit } }} transition={{ duration: DUR.standard, ease: EASE.smooth }} className="grid gap-2">
            {rows[cat].map((r, i) => (
              <motion.div key={r.label} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 + i * 0.08 }} className="flex items-baseline justify-between gap-2 border-b border-rule pb-1.5">
                <dt className="text-caption text-muted">{r.label}</dt>
                <dd className="text-small font-bold text-ink">{r.extra ?? (r.value == null ? "After 40" : <AnimatedNumber value={r.value} format={r.fmt} />)}</dd>
              </motion.div>
            ))}
          </motion.dl>
        </AnimatePresence>
      </div>
      <MiniCurve series={mBE.series} be={mBE.breakEven} slot={slot} />
    </div>
  );
}

const SLOT_INK = ["var(--trace-a)", "var(--trace-b)", "var(--trace-d)", "var(--trace-e)"];

function MiniCurve({ series, be, slot }: { series: number[]; be: number | null; slot: number }) {
  const base = cumulativeSeries(BASELINE, 40);
  const W = 240;
  const H = 56;
  const all = [...series, ...base];
  const x = linear([18, 40], [2, W - 2]);
  const y = linear([Math.min(0, ...all), Math.max(...all)], [H - 3, 3]);
  const d = (s: number[]) => linePath(s.map((v, i) => [x(18 + i), y(v)]));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mt-auto h-14 w-full" role="img" aria-label={be ? `Passes working from 18 at age ${be.toFixed(1)}` : "Does not pass working from 18 by 40"}>
      <path d={d(base)} fill="none" stroke="var(--trace-c)" strokeWidth={1.25} strokeDasharray="4 3" vectorEffect="non-scaling-stroke" />
      <motion.path initial={false} animate={{ d: d(series) }} transition={{ duration: 0.6, ease: EASE.smooth }} fill="none" stroke={SLOT_INK[slot]} strokeWidth={2} vectorEffect="non-scaling-stroke" />
      {be && (
        <motion.circle initial={false} animate={{ cx: x(be), cy: y(series[Math.min(series.length - 1, Math.round(be - 18))]) }} transition={{ duration: 0.6, ease: EASE.spring }} r={3.5} fill="var(--surface)" stroke="var(--ink)" strokeWidth={1.5} />
      )}
    </svg>
  );
}

function EmptySlot({ i, onSuggest }: { i: number; onSuggest?: () => void }) {
  return (
    <div className="grid h-full min-h-[300px] place-items-center rounded-md border border-dashed border-rule-strong p-4 text-center">
      <div className="grid justify-items-center gap-2">
        <span className="grid size-9 place-items-center rounded-full border border-dashed border-rule-strong text-caption font-bold text-muted" aria-hidden>
          {String(i + 1).padStart(2, "0")}
        </span>
        <p className="text-small text-ink-2">{i === 0 ? "No colleges selected." : i === 1 ? "Add a second to compare" : "Optional"}</p>
        {onSuggest && (
          <button type="button" onClick={onSuggest} className="rounded-full border border-rule-strong bg-surface px-3 py-1.5 text-caption font-semibold text-ink hover:border-ink">
            Try Berkeley vs NYU vs SJSU
          </button>
        )}
      </div>
    </div>
  );
}
