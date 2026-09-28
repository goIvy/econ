import { cn } from "@/lib/cn";
import { Reveal } from "@/components/ui/reveal";

/** Section shell: consistent rhythm, more space above a heading than below. */
export function Section({
  id,
  children,
  className,
  inner,
  tone = "paper",
  labelledBy,
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
  inner?: string;
  tone?: "paper" | "surface" | "sunk";
  labelledBy?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cn(
        "relative py-20 md:py-28",
        tone === "surface" && "border-y border-rule bg-surface",
        tone === "sunk" && "border-y border-rule bg-surface-sunk",
        className,
      )}
    >
      <div className={cn("mx-auto max-w-[1200px] px-4 md:px-8 xl:px-12", inner)}>{children}</div>
    </section>
  );
}

export function SectionHeading({ id, title, children, className }: { id: string; title: string; children?: React.ReactNode; className?: string }) {
  return (
    <Reveal className={cn("grid max-w-[44rem] gap-4", className)}>
      <h2 id={id} className="text-h2 font-bold">
        {title}
      </h2>
      {children && <div className="text-lede text-ink-2">{children}</div>}
    </Reveal>
  );
}

/** Tick-marked divider for quantitative sections. */
export function AxisRule({ className }: { className?: string }) {
  return <div aria-hidden className={cn("axis-rule", className)} />;
}
