"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Dialog, Popover } from "radix-ui";
import { ExternalLink, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { Confidence, Lineage } from "@/types";
import { SOURCES } from "@/data/sources";
import { getMethodology } from "@/data/methodologies";
import { overlay, pop, sheet } from "@/lib/animations";
import { cn } from "@/lib/cn";
import { useMedia } from "@/hooks/use-media";

// ---------------------------------------------------------------- confidence

const CONFIDENCE: Record<Confidence, { label: string; filled: number; cls: string }> = {
  high: { label: "High confidence", filled: 3, cls: "bg-gain-tint text-gain" },
  moderate: { label: "Moderate confidence", filled: 2, cls: "bg-caution-tint text-caution" },
  limited: { label: "Limited data", filled: 1, cls: "bg-surface-sunk text-muted" },
};

/** Three-segment gauge + word. Never color alone. */
export function ConfidenceBadge({ level, className }: { level: Confidence; className?: string }) {
  const c = CONFIDENCE[level];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[0.75rem] font-semibold", c.cls, className)}>
      <span className="flex items-end gap-[2px]" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span key={i} className={cn("w-[3px] rounded-[1px] bg-current", i < c.filled ? "opacity-100" : "opacity-25")} style={{ height: 5 + i * 2.5 }} />
        ))}
      </span>
      {c.label}
    </span>
  );
}

/** "Sample data" marker shown on every readout cluster while data is seeded. */
export function SampleChip({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full bg-caution-tint px-2 py-0.5 text-[0.75rem] font-semibold text-caution", className)}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      Sample data
    </span>
  );
}

// ---------------------------------------------------------------- source footnote

export function LineageBody({ metric, lineage }: { metric: string; lineage: Lineage }) {
  const source = SOURCES[lineage.sourceId];
  const method = getMethodology(source.methodologyId);
  const rows: Array<[string, React.ReactNode]> = [
    ["Source", `${source.name} (${source.publisher})`],
    ["Dataset", source.dataset],
    ["Year", lineage.year],
    ["Population", lineage.population],
    ["Last updated", new Date(lineage.lastUpdated).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })],
    ...(lineage.sampleSize ? ([["Sample size", `≈ ${lineage.sampleSize.toLocaleString("en-US")}`]] as Array<[string, React.ReactNode]>) : []),
    ["Methodology", method ? method.simple : "See the methodology page."],
  ];
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <ConfidenceBadge level={lineage.confidence} />
        {lineage.demo && <SampleChip />}
      </div>
      <p className="font-display text-[1.05rem] font-semibold leading-snug text-ink">{metric}</p>
      <dl className="grid gap-2 text-small">
        {rows.map(([k, v]) => (
          <div key={k} className="grid grid-cols-[6.5rem_1fr] gap-3">
            <dt className="text-muted">{k}</dt>
            <dd className="text-ink-2">{v}</dd>
          </div>
        ))}
      </dl>
      {lineage.note && <p className="rounded-sm bg-surface-sunk px-3 py-2 text-caption text-ink-2">{lineage.note}</p>}
      {lineage.demo && (
        <p className="text-caption text-muted">Seeded demo value, not from a live dataset. It shows where this number will come from once live data is connected.</p>
      )}
      <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-rule pt-3 text-caption">
        <Link href={`/methodology#${source.methodologyId}`} className="font-semibold text-ink underline decoration-rule-strong hover:decoration-ink">
          How this is calculated
        </Link>
        {source.url.startsWith("http") && (
          <a href={source.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-ink-2 underline decoration-rule-strong hover:text-ink">
            {source.name} <ExternalLink className="size-3" aria-hidden />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        )}
      </div>
    </div>
  );
}

/**
 * The footnote marker every metric carries. Opens a popover on desktop and a
 * bottom sheet on phones, showing source, dataset, year, population, last
 * updated, methodology and confidence.
 */
export function SourceFootnote({ metric, lineage, n, className }: { metric: string; lineage: Lineage; n?: number; className?: string }) {
  const [open, setOpen] = useState(false);
  const desktop = useMedia("(min-width: 768px)");
  const trigger = (
    <button
      type="button"
      className={cn(
        "tabular relative inline-flex h-[1.15rem] min-w-[1.15rem] -translate-y-[0.35em] items-center justify-center rounded-[4px] border border-rule-strong bg-surface px-1 align-baseline text-[0.625rem] font-semibold leading-none text-ink-2 transition-colors after:absolute after:-inset-[5px] after:content-[''] hover:border-ink hover:text-ink",
        className,
      )}
      aria-label={`View source for ${metric}`}
    >
      {n ?? "i"}
    </button>
  );

  if (desktop) {
    return (
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>{trigger}</Popover.Trigger>
        <AnimatePresence>
          {open && (
            <Popover.Portal forceMount>
              <Popover.Content asChild sideOffset={8} align="start" collisionPadding={16} forceMount>
                <motion.div
                  variants={pop}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="z-50 w-[22rem] rounded-md border border-rule bg-surface p-4 shadow-3"
                >
                  <LineageBody metric={metric} lineage={lineage} />
                </motion.div>
              </Popover.Content>
            </Popover.Portal>
          )}
        </AnimatePresence>
      </Popover.Root>
    );
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div className="fixed inset-0 z-50 bg-ink/30" variants={overlay} initial="hidden" animate="visible" exit="exit" />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount>
              <motion.div
                variants={sheet}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] overflow-y-auto rounded-t-lg border-t border-rule bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-3"
              >
                <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-rule-strong" aria-hidden />
                <div className="mb-2 flex items-center justify-between">
                  <Dialog.Title className="text-caption font-semibold text-muted">View source</Dialog.Title>
                  <Dialog.Close className="grid size-9 place-items-center rounded-sm text-ink-2 hover:bg-surface-sunk" aria-label="Close">
                    <X className="size-4" />
                  </Dialog.Close>
                </div>
                <Dialog.Description className="sr-only">Where this number comes from</Dialog.Description>
                <LineageBody metric={metric} lineage={lineage} />
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

// ---------------------------------------------------------------- path tag

export type TraceKey = "a" | "b" | "c" | "d" | "e";
export const TRACE_KEYS: TraceKey[] = ["a", "b", "c", "d", "e"];
export const TRACE_VAR: Record<TraceKey, string> = { a: "var(--trace-a)", b: "var(--trace-b)", c: "var(--trace-c)", d: "var(--trace-d)", e: "var(--trace-e)" };
export const TRACE_TINT: Record<TraceKey, string> = { a: "var(--trace-a-tint)", b: "var(--trace-b-tint)", c: "var(--trace-c-tint)", d: "var(--trace-d-tint)", e: "var(--trace-e-tint)" };
/** Line style per path: secondary encoding so identity never rests on color alone. */
export const TRACE_DASH: Record<TraceKey, string | undefined> = { a: undefined, b: undefined, c: "6 4", d: "2 3", e: "8 3 2 3" };

export function PathTag({ trace, className, size = "md" }: { trace: TraceKey; className?: string; size?: "sm" | "md" }) {
  return (
    <span
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-xs font-sans font-bold leading-none text-on-ink",
        size === "md" ? "size-[22px] text-[0.8125rem]" : "size-[18px] text-[0.6875rem]",
        className,
      )}
      style={{ background: TRACE_VAR[trace] }}
      aria-label={`Path ${trace.toUpperCase()}`}
    >
      {trace.toUpperCase()}
    </span>
  );
}

/** Line key used in legends and tooltips: a short stroke in the path's style. */
export function LineKey({ trace, muted, ink }: { trace?: TraceKey; muted?: boolean; ink?: boolean }) {
  return (
    <svg width="22" height="8" aria-hidden className="shrink-0">
      <line
        x1="1" y1="4" x2="21" y2="4"
        stroke={muted ? "var(--muted)" : ink ? "var(--ink)" : TRACE_VAR[trace ?? "a"]}
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={muted ? "1 3" : trace ? TRACE_DASH[trace] : undefined}
      />
    </svg>
  );
}
