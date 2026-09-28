/**
 * Earnings projections. Everything is in constant 2024 dollars.
 */

/** Years from graduation until the mid-career median is reached. */
export const YEARS_TO_MID_CAREER = 15;
/** Real growth after mid-career. */
export const LATE_CAREER_GROWTH = 0.005;

/**
 * Annual salary for each year after graduation. Earnings grow geometrically
 * from the starting salary to the mid-career median over 15 years, then slowly.
 * `growthOverride` (e.g. 0.03) replaces the implied growth rate when given.
 */
export function projectSalary(opts: { start: number; midCareer: number; years: number; growthOverride?: number }): number[] {
  const { start, midCareer, years } = opts;
  if (start <= 0 || years <= 0) return Array.from({ length: Math.max(0, years) }, () => 0);
  const implied = Math.pow(Math.max(midCareer, start) / start, 1 / YEARS_TO_MID_CAREER) - 1;
  const g = opts.growthOverride ?? implied;
  const out: number[] = [];
  let salary = start;
  for (let t = 0; t < years; t++) {
    out.push(salary);
    salary *= 1 + (t < YEARS_TO_MID_CAREER || opts.growthOverride != null ? g : LATE_CAREER_GROWTH);
  }
  return out;
}

/** Running total of a series. */
export function calculateCumulativeEarnings(series: number[]): number[] {
  let total = 0;
  return series.map((v) => (total += v));
}

/** Purchasing-power adjustment using regional price parity (US = 100). */
export function adjustForCostOfLiving(salary: number, rpp: number): number {
  if (rpp <= 0) return salary;
  return (salary * 100) / rpp;
}

/** Salary needed in `toRpp` to match the purchasing power of `salary` in `fromRpp`. */
export function equivalentSalary(salary: number, fromRpp: number, toRpp: number): number {
  return (salary * toRpp) / fromRpp;
}

/** Convert a nominal amount `years` in the future into today's dollars. */
export function adjustForInflation(amount: number, years: number, inflationRate = 0.025): number {
  return amount / Math.pow(1 + inflationRate, years);
}

/** Present value of a series of annual cash flows at a real discount rate. */
export function netPresentValue(flows: number[], discountRate = 0.03): number {
  return flows.reduce((sum, f, t) => sum + f / Math.pow(1 + discountRate, t), 0);
}
