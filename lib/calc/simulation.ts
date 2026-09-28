/**
 * "1,000 Possible Futures": a Monte Carlo run of one path (spec §28–30).
 *
 * Each future draws a starting salary, a job search, a graduation time and a
 * cost variation, then runs the ordinary path model. Seeded, so the same
 * inputs always give the same futures (and tests are deterministic).
 *
 * Assumptions are exported so the UI can state them next to the chart.
 */
import type { College, SalaryPercentiles } from "@/types";
import type { PathInputs } from "@/types";
import { projectNoCollege, projectPath, calculateBreakEvenYear, type PathContext, type ProjectionOptions } from "./projection";

export const SIM_ASSUMPTIONS = {
  /** Starting salaries follow a log-normal fitted to the program's 10th/50th/90th percentiles. */
  salary: "Log-normal fitted to the program's 10th, 50th and 90th percentile starting salaries",
  /** Months spent job-hunting after graduation: exponential, mean 3 months, capped at 12. */
  jobSearchMeanMonths: 3,
  /** Share of late finishers who take 5 years (the rest take 6). */
  fiveYearShareOfLate: 0.6,
  /** Standard deviation of the cost multiplier (tuition increases, living-cost surprises). */
  costSd: 0.06,
  note: "Futures assume the student graduates. See graduation probability for the chance of not finishing.",
} as const;

/** Small, fast, seedable PRNG (mulberry32). */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function normal(rand: () => number): number {
  const u = Math.max(1e-12, rand());
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

const Z90 = 1.2815515655446004;

/** Draw a starting salary from a log-normal fitted to reported percentiles. */
export function drawSalary(p: SalaryPercentiles, rand: () => number): number {
  const mu = Math.log(p.p50);
  const sigma = Math.max(0.05, (Math.log(p.p90) - Math.log(p.p10)) / (2 * Z90));
  const s = Math.exp(mu + sigma * normal(rand));
  return Math.min(p.p90 * 1.6, Math.max(p.p10 * 0.5, s));
}

/** Years to graduate, conditional on graduating within 6 years. */
export function drawYears(college: Pick<College, "gradRate4" | "gradRate6">, rand: () => number): number {
  const g4 = college.gradRate4.value ?? 0;
  const g6 = college.gradRate6.value ?? 0;
  const pOnTime = g6 > 0 ? Math.min(1, g4 / g6) : 0.7;
  const u = rand();
  if (u < pOnTime) return 4;
  return u < pOnTime + (1 - pOnTime) * SIM_ASSUMPTIONS.fiveYearShareOfLate ? 5 : 6;
}

export interface SimulationResult {
  ages: number[];
  /** Cumulative net value for every future (runs × ages). */
  runs: Float64Array[];
  /** Percentile bands per age. */
  bands: { p10: number[]; p50: number[]; p90: number[] };
  /** Final cumulative value for each run, sorted ascending. */
  finals: number[];
  median: number;
  downside: number;
  upside: number;
  /** Share of futures that pass the no-college path within 10 years of graduating. */
  recoverWithin10: number;
  /** Share that never pass it by the horizon. */
  neverRecover: number;
  baseline: number[];
}

export interface SimulationOptions extends ProjectionOptions {
  runs?: number;
  seed?: number;
}

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

export function runMonteCarlo(inputs: PathInputs, ctx: PathContext, opts: SimulationOptions = {}): SimulationResult {
  const n = opts.runs ?? 1000;
  const rand = rng(opts.seed ?? 20240918);
  const percentiles = ctx.outcome.earlyCareer.value ?? ctx.major.earlyCareer.value;
  const baselineRows = projectNoCollege({ horizonAge: opts.horizonAge, stateRate: (ctx.careerCity ?? ctx.collegeCity)?.stateTaxRate });
  const ages = baselineRows.map((r) => r.age);
  const runs: Float64Array[] = [];
  let recovered = 0;
  let never = 0;

  for (let i = 0; i < n; i++) {
    const salary = percentiles ? drawSalary(percentiles, rand) : undefined;
    const years = drawYears(ctx.college, rand);
    const jobSearchYears = Math.min(1, (-Math.log(1 - Math.min(0.999999, rand())) * SIM_ASSUMPTIONS.jobSearchMeanMonths) / 12);
    const costMultiplier = Math.min(1.25, Math.max(0.85, 1 + normal(rand) * SIM_ASSUMPTIONS.costSd));
    const r = projectPath({ ...inputs, yearsToGraduate: years }, ctx, { ...opts, salaryOverride: salary, jobSearchYears, costMultiplier });
    const series = new Float64Array(r.rows.length);
    r.rows.forEach((row, k) => (series[k] = row.cumulative));
    runs.push(series);
    const be = calculateBreakEvenYear(r.rows, baselineRows, r.graduationAge);
    if (!be) never++;
    else if (be.age <= r.graduationAge + 10) recovered++;
  }

  const p10: number[] = [];
  const p50: number[] = [];
  const p90: number[] = [];
  const col: number[] = new Array(n);
  for (let k = 0; k < ages.length; k++) {
    for (let i = 0; i < n; i++) col[i] = runs[i][k] ?? runs[i][runs[i].length - 1];
    const sorted = [...col].sort((x, y) => x - y);
    p10.push(quantile(sorted, 0.1));
    p50.push(quantile(sorted, 0.5));
    p90.push(quantile(sorted, 0.9));
  }
  const finals = runs.map((s) => s[s.length - 1]).sort((x, y) => x - y);

  return {
    ages,
    runs,
    bands: { p10, p50, p90 },
    finals,
    median: quantile(finals, 0.5),
    downside: quantile(finals, 0.1),
    upside: quantile(finals, 0.9),
    recoverWithin10: recovered / n,
    neverRecover: never / n,
    baseline: baselineRows.map((r) => r.cumulative),
  };
}
