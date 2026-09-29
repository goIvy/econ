"use client";

import { Plus } from "@/components/ui/icons";
import { DataKindChip, type DataKind } from "@/components/ui/data-kind";
import { cn } from "@/lib/cn";

/**
 * A bento tile for one number: label, big value, data-kind badge and a short
 * note. `feature` is the large lead tile. When `onToggle` is given the whole
 * tile is a disclosure button that opens the number's details below.
 */
export function MetricCard({
  label,
  value,
  kind,
  sub,
  expanded,
  onToggle,
  controls,
  className,
  feature = false,
}: {
  label: string;
  value: React.ReactNode;
  kind: DataKind;
  sub?: React.ReactNode;
  expanded?: boolean;
  onToggle?: () => void;
  controls?: string;
  className?: string;
  feature?: boolean;
}) {
  const body = (
    <>
      {feature && <span aria-hidden className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-accent opacity-[0.14] blur-3xl" />}
      <span className="flex items-center justify-between gap-3">
        <span className="text-small font-medium text-ink-2">{label}</span>
        <DataKindChip kind={kind} />
      </span>
      <span
        className={cn(
          "tabular block font-semibold leading-[0.9] tracking-[-0.05em] text-ink",
          feature ? "mt-auto pt-8 text-[clamp(3.5rem,8vw,6.5rem)]" : "mt-auto pt-6 text-[clamp(2.1rem,3.4vw,2.75rem)]",
        )}
      >
        {value}
      </span>
      <span className="flex items-end justify-between gap-3">
        {sub ? <span className={cn("block text-caption text-muted", feature && "text-small")}>{sub}</span> : <span />}
        {onToggle && (
          <span className={cn("grid size-8 shrink-0 place-items-center rounded-full ring-1 ring-rule transition-[background-color,color,transform] duration-500 ease-[var(--ease-premium)] group-hover/tile:bg-ink group-hover/tile:text-on-ink", expanded ? "rotate-45 bg-ink text-on-ink" : "text-ink-2")}>
            <Plus className="size-3.5" aria-hidden />
            <span className="sr-only">{expanded ? "Hide details" : "Show details"}</span>
          </span>
        )}
      </span>
    </>
  );
  const cls = cn(
    "group/tile relative isolate flex min-h-[11rem] flex-col gap-2 overflow-hidden rounded-md bg-surface p-5 text-left shadow-[var(--hairline-inset)] transition-shadow duration-300 sm:p-6",
    feature && "min-h-[15rem] lg:min-h-full",
    expanded && "shadow-[inset_0_0_0_1.5px_var(--accent),var(--hairline-inset)]",
    className,
  );
  return onToggle ? (
    <button type="button" onClick={onToggle} aria-expanded={expanded} aria-controls={controls} className={cls}>
      {body}
    </button>
  ) : (
    <div className={cls}>{body}</div>
  );
}
