"use client";

import { ChevronDown } from "@/components/ui/icons";
import { DataKindChip, type DataKind } from "@/components/ui/data-kind";
import { cn } from "@/lib/cn";

/**
 * The one metric card style: label, big compact value, data-kind badge and a
 * short note. When `onToggle` is given it becomes a disclosure button that
 * opens the metric's details.
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
  size = "md",
}: {
  label: string;
  value: React.ReactNode;
  kind: DataKind;
  sub?: React.ReactNode;
  expanded?: boolean;
  onToggle?: () => void;
  controls?: string;
  className?: string;
  size?: "md" | "sm";
}) {
  const body = (
    <>
      <span className="text-caption font-semibold text-ink-2">{label}</span>
      <span className={cn("tabular block font-extrabold leading-none tracking-[-0.035em] text-ink", size === "md" ? "text-[clamp(2rem,3.2vw,2.6rem)]" : "text-h2")}>{value}</span>
      {sub && <span className="block text-caption text-muted">{sub}</span>}
      <span className="mt-auto flex items-center justify-between gap-2 pt-2">
        <DataKindChip kind={kind} />
        {onToggle && (
          <span className="flex items-center gap-1 text-caption font-semibold text-ink-2">
            {expanded ? "Hide" : "Details"}
            <ChevronDown className={cn("size-3.5 transition-transform", expanded && "rotate-180")} aria-hidden />
          </span>
        )}
      </span>
    </>
  );
  const cls = cn(
    "grid content-start gap-2 rounded-md border bg-surface p-4 text-left transition-colors",
    expanded ? "border-ink shadow-2" : "border-rule",
    onToggle && "hover:border-rule-strong",
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
