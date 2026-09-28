"use client";

import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { Plus, RotateCw, X } from "lucide-react";
import { useRef, useState } from "react";
import { Tilt, useFinePointer } from "@/components/motion";
import { ConfidenceBadge, SampleChip, SourceFootnote } from "@/components/ui/lineage";
import { ButtonLink } from "@/components/ui/button";
import { collapse, flipTransition, growWidth, ledgerItem, slotSpring } from "@/lib/animations";
import { money, moneyCompact, pct } from "@/lib/format";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/cn";
import type { Confidence } from "@/types";
import type { CompareCardData } from "./data";

const MAX = 3;
const SLOT_TONES = ["var(--ink)", "color-mix(in srgb, var(--ink) 62%, var(--surface))", "color-mix(in srgb, var(--ink) 34%, var(--surface))"];

/**
 * Drag college cards onto the stage (or tap +). Staged cards glide into
 * slots and a comparison opens underneath. Each measure has its own scale;
 * nothing is ranked.
 */
export function CompareStage({ cards }: { cards: CompareCardData[] }) {
  const [staged, setStaged] = useState<string[]>([]);
  const [over, setOver] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const fine = useFinePointer();
  const reduce = useReducedMotion();

  const add = (id: string) => setStaged((s) => (s.includes(id) || s.length >= MAX ? s : [...s, id]));
  const remove = (id: string) => setStaged((s) => s.filter((x) => x !== id));
  const inStage = (x: number, y: number) => {
    const r = stageRef.current?.getBoundingClientRect();
    return !!r && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  };
  const tray = cards.filter((c) => !staged.includes(c.id));
  const chosen = staged.map((id) => cards.find((c) => c.id === id)!);
  const full = staged.length >= MAX;

  return (
    <LayoutGroup>
      <div className="grid gap-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-small text-ink-2">{fine ? "Drag a card onto the stage, or press + on it." : "Tap + on a card to put it on the stage."} Flip a card for debt, jobs and break-even.</p>
          <SampleChip />
        </div>

        {/* tray: swipeable row on phones */}
        <ul className="-mx-4 flex scroll-px-4 snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0" aria-label="Colleges you can compare">
          <AnimatePresence initial={false} mode="popLayout">
            {tray.map((c) => (
              <motion.li
                key={c.id}
                layoutId={c.id}
                transition={slotSpring}
                className="shrink-0 snap-start"
                drag={fine && !reduce && !full}
                dragSnapToOrigin
                dragElastic={0.6}
                whileDrag={{ scale: 1.04, rotate: 1.5, zIndex: 30, boxShadow: "var(--shadow-3)" }}
                onDrag={(_, i) => setOver(inStage(i.point.x - window.scrollX, i.point.y - window.scrollY))}
                onDragEnd={(_, i) => {
                  setOver(false);
                  if (inStage(i.point.x - window.scrollX, i.point.y - window.scrollY)) add(c.id);
                }}
                style={{ touchAction: fine ? "none" : "pan-x" }}
              >
                <Tilt>
                  <CollegeCard card={c} action={{ label: `Add ${c.shortName} to the comparison`, icon: "add", onClick: () => add(c.id), disabled: full }} />
                </Tilt>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>

        {/* stage */}
        <div
          ref={stageRef}
          className={cn("measured-field relative grid gap-4 rounded-lg border-2 border-dashed p-3 transition-colors sm:p-5", over ? "border-ink bg-surface" : "border-rule-strong")}
          aria-label="Comparison stage"
          role="region"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-small font-semibold text-ink">
              Comparison stage <span className="font-normal text-muted">({staged.length} of {MAX})</span>
            </p>
            {staged.length > 0 && (
              <button type="button" onClick={() => setStaged([])} className="text-small text-ink-2 underline-offset-4 hover:text-ink hover:underline">
                Clear
              </button>
            )}
          </div>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: MAX }, (_, i) => {
              const c = chosen[i];
              return (
                <li key={c?.id ?? `slot-${i}`} className="min-h-[236px]">
                  {c ? (
                    <motion.div layoutId={c.id} transition={slotSpring} className="h-full">
                      <CollegeCard card={c} slot={i} action={{ label: `Remove ${c.shortName}`, icon: "remove", onClick: () => remove(c.id) }} />
                    </motion.div>
                  ) : (
                    <EmptySlot index={i} onSuggest={i === 0 && staged.length === 0 ? () => setStaged(["uc-berkeley.economics", "nyu.finance"]) : undefined} />
                  )}
                </li>
              );
            })}
          </ul>

          <AnimatePresence initial={false}>
            {chosen.length >= 2 && (
              <motion.div key="cmp" variants={collapse} initial="hidden" animate="visible" exit="exit" className="overflow-hidden">
                <Comparison cards={chosen} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ButtonLink href={chosen.length ? `/compare?p=${chosen.map((c) => `${c.id}.r.c.${c.aid}`).join(",")}` : "/compare"} variant="secondary">
            Open the full comparison
          </ButtonLink>
          <p className="text-caption text-muted">Resident tuition, on campus. Change residency, aid and living there.</p>
        </div>
      </div>
    </LayoutGroup>
  );
}

interface CardAction {
  label: string;
  icon: "add" | "remove";
  onClick: () => void;
  disabled?: boolean;
}

function CollegeCard({ card: c, action, slot }: { card: CompareCardData; action: CardAction; slot?: number }) {
  const [flipped, setFlipped] = useState(false);
  const reduce = useReducedMotion();
  const Icon = action.icon === "add" ? Plus : X;
  return (
    <div className="relative h-[236px] w-[244px] [perspective:1000px] md:w-full">
      <motion.div
        className="relative h-full w-full [transform-style:preserve-3d]"
        initial={false}
        animate={{ rotateY: flipped && !reduce ? 180 : 0 }}
        transition={flipTransition}
      >
        {/* front */}
        <Face hidden={flipped} className={cn(slot != null && "ring-2 ring-offset-2 ring-offset-paper")} slot={slot}>
          <Header c={c} />
          <dl className="grid grid-cols-3 gap-2">
            <Mini label="Cost/yr" value={moneyCompact(c.netPerYear)} />
            <Mini label="Salary" value={moneyCompact(c.salary)} />
            <Mini label="Grad rate" value={pct(c.grad6)} />
          </dl>
          <Footer onFlip={() => setFlipped(true)} flipLabel={`Show more about ${c.shortName}`} action={action} Icon={Icon} />
        </Face>
        {/* back */}
        <Face back hidden={!flipped} reduce={reduce} slot={slot}>
          <Header c={c} />
          <dl className="grid grid-cols-3 gap-2">
            <Mini label="Debt" value={moneyCompact(c.debt)} />
            <Mini label="Employed" value={pct(c.employment)} />
            <Mini label="Break-even" value={c.breakEven ? c.breakEven.toFixed(1) : "After 45"} />
          </dl>
          <div className="flex items-center gap-2">
            <ConfidenceBadge level={c.confidence as Confidence} />
            {c.isFallback && <span className="text-[0.75rem] text-muted">College-wide data</span>}
          </div>
          <Footer onFlip={() => setFlipped(false)} flipLabel={`Show the front of ${c.shortName}`} action={action} Icon={Icon} />
        </Face>
      </motion.div>
    </div>
  );
}

function Face({ children, back, hidden, reduce, className, slot }: { children: React.ReactNode; back?: boolean; hidden: boolean; reduce?: boolean; className?: string; slot?: number }) {
  return (
    <div
      aria-hidden={hidden}
      inert={hidden}
      className={cn(
        "absolute inset-0 grid content-between gap-2 rounded-md border border-rule bg-surface p-4 shadow-2 [backface-visibility:hidden]",
        back && !reduce && "[transform:rotateY(180deg)]",
        back && reduce && (hidden ? "invisible" : ""),
        !back && reduce && hidden && "invisible",
        className,
      )}
      style={slot != null ? ({ "--tw-ring-color": SLOT_TONES[slot] } as React.CSSProperties) : undefined}
    >
      {children}
    </div>
  );
}

function Header({ c }: { c: CompareCardData }) {
  return (
    <div className="grid gap-0.5">
      <p className="text-[0.75rem] font-medium text-muted">
        {c.control === "public" ? "Public" : "Private"}, {c.state}
      </p>
      <p className="truncate text-base font-semibold text-ink">{c.shortName}</p>
      <p className="truncate text-caption text-ink-2">{c.major}</p>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-0.5">
      <dt className="text-[0.75rem] text-muted">{label}</dt>
      <dd className="tabular text-small font-semibold text-ink">{value}</dd>
    </div>
  );
}

function Footer({ onFlip, flipLabel, action, Icon }: { onFlip: () => void; flipLabel: string; action: CardAction; Icon: typeof Plus }) {
  return (
    <div className="flex items-center justify-between">
      <button type="button" onClick={onFlip} aria-label={flipLabel} className="flex h-9 items-center gap-1.5 rounded-sm px-2 text-caption font-semibold text-ink-2 hover:bg-surface-sunk hover:text-ink">
        <RotateCw className="size-3.5" aria-hidden /> Flip
      </button>
      <motion.button
        type="button"
        onClick={action.onClick}
        disabled={action.disabled}
        aria-label={action.label}
        whileTap={{ scale: 0.92 }}
        onPointerDownCapture={(e) => e.stopPropagation()}
        className="grid size-9 place-items-center rounded-full border border-rule-strong bg-surface text-ink hover:border-ink disabled:opacity-40"
      >
        <Icon className="size-4" aria-hidden />
      </motion.button>
    </div>
  );
}

function EmptySlot({ index, onSuggest }: { index: number; onSuggest?: () => void }) {
  return (
    <div className="grid h-full min-h-[236px] place-items-center rounded-md border border-dashed border-rule-strong bg-paper/70 p-4 text-center">
      <div className="grid justify-items-center gap-2">
        <span className="grid size-9 place-items-center rounded-full border border-dashed border-rule-strong text-muted" aria-hidden>
          {index + 1}
        </span>
        <p className="text-small text-ink-2">{index === 0 ? "Add your first college" : index === 1 ? "Add a second to compare" : "Optional third"}</p>
        {onSuggest && (
          <button type="button" onClick={onSuggest} className="rounded-full border border-rule-strong bg-surface px-3 py-1.5 text-caption font-semibold text-ink hover:border-ink">
            Try UC Berkeley vs NYU
          </button>
        )}
      </div>
    </div>
  );
}

const ROWS: Array<{ key: keyof CompareCardData; label: string; fmt: (v: number) => string; hint: string }> = [
  { key: "net4", label: "Net price, 4 years", fmt: money, hint: "After average aid for this scenario" },
  { key: "debt", label: "Borrowed", fmt: money, hint: "Federal loans at 6.53%" },
  { key: "grad6", label: "Graduate in 6 years", fmt: (v) => pct(v), hint: "All students at the college" },
  { key: "salary", label: "Starting salary", fmt: money, hint: "Median, this major at this college" },
  { key: "employment", label: "Employed", fmt: (v) => pct(v), hint: "Graduates working, 1 year out" },
  { key: "breakEven", label: "Break-even age", fmt: (v) => v.toFixed(1), hint: "Passes the no-college path" },
];

function Comparison({ cards }: { cards: CompareCardData[] }) {
  return (
    <div className="mt-2 grid gap-4 rounded-md border border-rule bg-surface p-4 sm:p-5">
      <p className="text-small text-ink-2">Each measure has its own scale. Longer isn&apos;t better or worse; it depends on what you&apos;re weighing.</p>
      {ROWS.map((row, r) => {
        const vals = cards.map((c) => (c[row.key] as number | null) ?? null);
        const max = Math.max(1, ...vals.map((v) => v ?? 0));
        return (
          <motion.div key={row.key} variants={ledgerItem} initial="hidden" animate="visible" transition={{ delay: r * 0.05 }} className="grid gap-2 sm:grid-cols-[180px_1fr] sm:items-center sm:gap-4">
            <div>
              <p className="text-small font-semibold text-ink">{row.label}</p>
              <p className="text-[0.75rem] text-muted">{row.hint}</p>
            </div>
            <ul className="grid gap-1.5">
              {cards.map((c, i) => (
                <li key={c.id} className="grid grid-cols-[92px_1fr] items-center gap-3 sm:grid-cols-[110px_1fr]">
                  <span className="truncate text-caption text-ink-2">{c.shortName}</span>
                  <span className="flex items-center gap-2">
                    <motion.span className="block h-3 rounded-r-[4px]" style={{ background: SLOT_TONES[i] }} variants={growWidth} custom={`${((vals[i] ?? 0) / max) * 72}%`} initial="hidden" animate="visible" />
                    <span className="tabular shrink-0 text-caption font-semibold text-ink">{vals[i] == null ? "After 45" : row.fmt(vals[i]!)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>
        );
      })}
      <div className="flex flex-wrap gap-3 border-t border-rule pt-3 text-caption text-muted">
        <span>Sources:</span>
        {cards.map((c, i) => (
          <span key={c.id} className="flex items-center gap-1">
            {c.shortName} <SourceFootnote metric={`${c.shortName} ${c.major} earnings`} lineage={c.lineage.earnings} n={i + 1} />
          </span>
        ))}
      </div>
    </div>
  );
}
