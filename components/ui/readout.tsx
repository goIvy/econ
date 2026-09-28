"use client";

import type { Lineage } from "@/types";
import { useCountUp } from "@/hooks/use-count-up";
import { cn } from "@/lib/cn";
import { money, number as formatNumber, pct } from "@/lib/format";
import { SourceFootnote } from "./lineage";
import { InfoTip } from "./info-tip";

/** Named formats, so server components can pass a format across the client boundary. */
const FORMATS = {
  money,
  pct: (n: number) => pct(n),
  pct1: (n: number) => pct(n, 1),
  number: (n: number) => formatNumber(n),
  decimal: (n: number) => n.toFixed(1),
} as const;
export type ReadoutFormat = keyof typeof FORMATS;

/**
 * Instrument readout: caption label, count-up number, muted unit, and a
 * footnote marker that opens the source. Renders a dt/dd pair, so always
 * place it inside a <dl>. Numbers use tabular figures because they animate
 * between values (proportional digits would jitter).
 */
export function Readout({
  label,
  value,
  format: formatProp,
  unit,
  lineage,
  footnote,
  explain,
  size = "md",
  estimate,
  className,
  emptyText = "No data",
}: {
  label: string;
  value: number | null;
  format: ((n: number) => string) | ReadoutFormat;
  unit?: string;
  lineage?: Lineage;
  footnote?: number;
  /** Plain-language explanation shown in an info tooltip. */
  explain?: string;
  size?: "sm" | "md" | "xl";
  /** Marks the value as a modeled estimate. */
  estimate?: boolean;
  className?: string;
  emptyText?: string;
}) {
  const format = typeof formatProp === "string" ? FORMATS[formatProp] : formatProp;
  const shown = useCountUp(value ?? 0, { enabled: value != null });
  return (
    <div className={cn("grid content-start gap-1", className)}>
      <dt className="flex items-center gap-1.5 text-caption font-medium text-muted">
        <span>{label}</span>
        {explain && <InfoTip label={label}>{explain}</InfoTip>}
      </dt>
      <dd className="grid gap-1">
        <span className="flex flex-wrap items-baseline gap-x-1.5">
          {value == null ? (
            <span className="text-small font-medium text-muted">{emptyText}</span>
          ) : (
            <span
              className={cn(
                "tabular font-sans font-semibold text-ink",
                size === "xl" ? "text-readout-xl" : size === "md" ? "text-readout" : "text-[1.125rem] leading-tight",
              )}
            >
              {format(shown)}
            </span>
          )}
          {value != null && unit && <span className="text-[0.8125rem] font-medium text-muted">{unit}</span>}
          {lineage && <SourceFootnote metric={label} lineage={lineage} n={footnote} />}
        </span>
        {estimate && value != null && <span className="text-[0.75rem] font-medium text-muted">Estimate</span>}
      </dd>
    </div>
  );
}
