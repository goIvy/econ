/**
 * Marginal analysis for the What-If Lab: how much one change moves the
 * break-even age and the money involved. Pure; the UI turns it into a sentence.
 */
import type { PathInputs } from "@/types";
import { calculateBreakEvenYear, projectNoCollege, projectPath, type PathContext, type ProjectionOptions } from "./projection";

export interface Scenario {
  inputs: PathInputs;
  opts: ProjectionOptions;
}

export function evaluate(s: Scenario, ctx: PathContext) {
  const result = projectPath(s.inputs, ctx, s.opts);
  const baseline = projectNoCollege({ horizonAge: s.opts.horizonAge, stateRate: (ctx.careerCity ?? ctx.collegeCity)?.stateTaxRate });
  const breakEven = calculateBreakEvenYear(result.rows, baseline, result.graduationAge);
  return { result, baseline, breakEven: breakEven?.age ?? null };
}

export interface Marginal {
  /** Positive = break-even arrives later with the change. Null when either side never breaks even. */
  breakEvenShift: number | null;
  /** Change in the total net price of college. */
  netPriceChange: number;
  /** Change in the amount borrowed. */
  borrowingChange: number;
  /** Break-even age after the change (null = not by the horizon). */
  after: number | null;
  before: number | null;
}

export function marginal(base: Scenario, changed: Scenario, ctx: PathContext): Marginal {
  const a = evaluate(base, ctx);
  const b = evaluate(changed, ctx);
  return {
    breakEvenShift: a.breakEven != null && b.breakEven != null ? b.breakEven - a.breakEven : null,
    netPriceChange: b.result.net.netPrice - a.result.net.netPrice,
    borrowingChange: b.result.net.borrowing - a.result.net.borrowing,
    after: b.breakEven,
    before: a.breakEven,
  };
}
