import { cn } from "@/lib/cn";

export type DataKind = "observed" | "estimated" | "projected" | "simulated";

const KIND: Record<DataKind, { label: string; title: string }> = {
  observed: { label: "Data", title: "Reported in a dataset (here: sample data shaped like it)." },
  estimated: { label: "Estimate", title: "Calculated from data with a stated method, e.g. net cost after grants." },
  projected: { label: "Estimate", title: "Modeled forward from today's data under stated assumptions. Not a prediction." },
  simulated: { label: "Simulation", title: "The result of many randomized futures; read it as a range." },
};

/** Small badge saying what kind of number this is: DATA, ESTIMATE or SIMULATION. */
export function DataKindChip({ kind, className }: { kind: DataKind; className?: string }) {
  const k = KIND[kind];
  return (
    <span
      title={k.title}
      className={cn(
        "inline-flex items-center rounded-full border px-1.5 py-px text-[10px] font-bold leading-4 tracking-[0.1em]",
        "text-ink-2", kind === "observed" ? "border-trace-b/50" : kind === "simulated" ? "border-trace-d/50" : "border-rule-strong",
        className,
      )}
    >
      {k.label.toUpperCase()}
    </span>
  );
}
