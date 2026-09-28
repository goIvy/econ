import { cn } from "@/lib/cn";

export type DataKind = "observed" | "estimated" | "projected" | "simulated";

const KIND: Record<DataKind, { label: string; title: string; dots: number }> = {
  observed: { label: "Observed", title: "Reported in a dataset (here: seeded sample data shaped like it).", dots: 4 },
  estimated: { label: "Estimated", title: "Derived from observed data with a stated method (e.g., net cost after average aid).", dots: 3 },
  projected: { label: "Projected", title: "Modeled forward from today's data with stated assumptions. Not a prediction.", dots: 2 },
  simulated: { label: "Simulated", title: "One of many randomized futures; read as a range, not a number.", dots: 1 },
};

/** Says which kind of number this is. Precision shown as filled dots (4 = observed … 1 = simulated). */
export function DataKindChip({ kind, className }: { kind: DataKind; className?: string }) {
  const k = KIND[kind];
  return (
    <span title={k.title} className={cn("inline-flex items-center gap-1.5 rounded-full border border-rule px-2 py-0.5 text-[10px] font-bold tracking-[0.12em] text-muted", className)}>
      <span className="flex gap-[2px]" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={cn("size-1 rounded-full bg-current", i < k.dots ? "opacity-100" : "opacity-25")} />
        ))}
      </span>
      {k.label.toUpperCase()}
      <span className="sr-only">: {k.title}</span>
    </span>
  );
}
