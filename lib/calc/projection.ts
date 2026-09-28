/**
 * The path model: one college × major × residency × aid × living scenario,
 * projected year by year from age 18. Pure functions over plain data so the
 * same model can run on the server, in the browser, or be ported to the
 * FastAPI service (backend/app/calc.py mirrors it).
 */
import type { City, College, CollegeMajorOutcome, LoanType, Major, PathInputs } from "@/types";
import { annualCostLines, calculateNetCost, sumLines, type CostLine, type NetCostBreakdown } from "./cost";
import { DEFAULT_RATES, summarizeLoan, type LoanSummary } from "./loans";
import { projectSalary } from "./earnings";
import { afterTax } from "./taxes";

export const START_AGE = 18;
export const DEFAULT_HORIZON_AGE = 45;
export const DEFAULT_LOAN_TERM = 10;

/**
 * The no-college comparison path: typical earnings for workers with a
 * high-school diploma (ACS/BLS shape), starting at 18. Demo values.
 */
export const NO_COLLEGE = {
  startSalary: 31000,
  midCareer: 46000,
  employmentRate: 0.93,
} as const;

export interface ProjectionRow {
  age: number;
  phase: "college" | "career";
  /** Expected pre-tax earnings (salary × employment rate), or work income during college. */
  earnings: number;
  afterTaxEarnings: number;
  /** Money paid toward college this year (net price not financed by loans). */
  collegeOutlay: number;
  loanPayment: number;
  /** Net cash flow for the year. */
  net: number;
  /** Cumulative net financial value to date. */
  cumulative: number;
}

export interface PathResult {
  inputs: PathInputs;
  costLines: CostLine[];
  net: NetCostBreakdown;
  loan: LoanSummary;
  startingSalary: number;
  employmentRate: number;
  rows: ProjectionRow[];
  /** Sum of expected pre-tax earnings over the first 10 years after graduation. */
  tenYearEarnings: number;
  graduationAge: number;
}

export interface PathContext {
  college: College;
  major: Major;
  outcome: CollegeMajorOutcome;
  /** City used for off-campus rent (usually the college's metro). */
  collegeCity?: City | null;
  /** City where the graduate works (for state tax). Defaults to collegeCity. */
  careerCity?: City | null;
}

export interface ProjectionOptions {
  horizonAge?: number;
  loanType?: LoanType;
  loanRatePct?: number;
  loanTermYears?: number;
  /** Which salary percentile drives the projection. */
  percentile?: "p10" | "p25" | "p50" | "p75" | "p90";
  /** Override annual real salary growth. */
  growthOverride?: number;
  /** Use this starting salary instead of a named percentile (simulation draws). */
  salaryOverride?: number;
  /** Scale every annual cost line (simulation cost variation). Default 1. */
  costMultiplier?: number;
  /** Fraction of the first career year spent looking for work, 0–1. Default 0. */
  jobSearchYears?: number;
}

export function projectPath(inputs: PathInputs, ctx: PathContext, opts: ProjectionOptions = {}): PathResult {
  const years = Math.max(1, inputs.yearsToGraduate);
  const horizonAge = opts.horizonAge ?? DEFAULT_HORIZON_AGE;
  const costLines = annualCostLines(ctx.college, inputs.residency, inputs.living, ctx.collegeCity);
  const net = calculateNetCost(sumLines(costLines) * (opts.costMultiplier ?? 1), years, inputs.funding);

  const loanType = opts.loanType ?? "federal-unsubsidized";
  const loan = summarizeLoan(
    { principal: net.borrowing, ratePct: opts.loanRatePct ?? DEFAULT_RATES[loanType], type: loanType, termYears: opts.loanTermYears ?? DEFAULT_LOAN_TERM },
    years,
  );

  const pct = opts.percentile ?? "p50";
  const startingSalary = opts.salaryOverride ?? ctx.outcome.earlyCareer.value?.[pct] ?? ctx.major.earlyCareer.value?.[pct] ?? 0;
  const medianStart = ctx.outcome.earlyCareer.value?.p50 ?? ctx.major.earlyCareer.value?.p50 ?? startingSalary;
  const midCareer = (ctx.outcome.midCareerMedian.value ?? ctx.major.midCareerMedian.value ?? startingSalary) * (startingSalary / (medianStart || startingSalary || 1));
  const employmentRate = (ctx.outcome.employmentRate.value ?? ctx.major.employmentRate.value ?? 95) / 100;
  const stateRate = (ctx.careerCity ?? ctx.collegeCity)?.stateTaxRate ?? 0.045;

  const graduationAge = START_AGE + years;
  const careerYears = Math.max(0, horizonAge - graduationAge + 1);
  const salaries = projectSalary({ start: startingSalary, midCareer, years: careerYears, growthOverride: opts.growthOverride });

  const outlayPerYear = (net.netPrice - net.borrowing) / years;
  const workPerYear = net.work / years;
  const monthly = loan.monthlyPayment;
  const repaymentYears = loan.payoffYears;

  const rows: ProjectionRow[] = [];
  let cumulative = 0;
  for (let age = START_AGE; age <= horizonAge; age++) {
    const inCollege = age < graduationAge;
    let earnings: number;
    let collegeOutlay = 0;
    let loanPayment = 0;
    if (inCollege) {
      earnings = workPerYear;
      collegeOutlay = outlayPerYear;
    } else {
      const t = age - graduationAge;
      earnings = (salaries[t] ?? 0) * employmentRate * (t === 0 ? 1 - Math.min(1, Math.max(0, opts.jobSearchYears ?? 0)) : 1);
      loanPayment = t < repaymentYears ? monthly * 12 : 0;
    }
    const afterTaxEarnings = inCollege ? earnings : afterTax(earnings, stateRate);
    const netFlow = afterTaxEarnings - collegeOutlay - loanPayment;
    cumulative += netFlow;
    rows.push({ age, phase: inCollege ? "college" : "career", earnings, afterTaxEarnings, collegeOutlay, loanPayment, net: netFlow, cumulative });
  }

  const tenYearEarnings = salaries.slice(0, 10).reduce((s, v) => s + v * employmentRate, 0);

  return { inputs, costLines, net, loan, startingSalary, employmentRate, rows, tenYearEarnings, graduationAge };
}

/** The no-college path: work from 18 at the typical high-school-graduate wage. */
export function projectNoCollege(opts: { horizonAge?: number; stateRate?: number } = {}): ProjectionRow[] {
  const horizonAge = opts.horizonAge ?? DEFAULT_HORIZON_AGE;
  const years = horizonAge - START_AGE + 1;
  const salaries = projectSalary({ start: NO_COLLEGE.startSalary, midCareer: NO_COLLEGE.midCareer, years });
  let cumulative = 0;
  return salaries.map((s, i) => {
    const earnings = s * NO_COLLEGE.employmentRate;
    const at = afterTax(earnings, opts.stateRate ?? 0.045);
    cumulative += at;
    return { age: START_AGE + i, phase: "career" as const, earnings, afterTaxEarnings: at, collegeOutlay: 0, loanPayment: 0, net: at, cumulative };
  });
}

export interface BreakEven {
  /** Fractional age at which `path` overtakes `alternative` for good. */
  age: number;
  /** Years after the path's graduation (fractional). */
  yearsAfterGraduation: number;
}

/**
 * First point where `path`'s cumulative value overtakes `alternative`'s and
 * stays ahead through the horizon. Linear interpolation between year-ends.
 * Returns null if it never overtakes (or is never behind: then age = start).
 */
export function calculateBreakEvenYear(path: ProjectionRow[], alternative: ProjectionRow[], graduationAge: number): BreakEven | null {
  const n = Math.min(path.length, alternative.length);
  if (n === 0) return null;
  const diff = (i: number) => path[i].cumulative - alternative[i].cumulative;
  if (diff(n - 1) < 0) return null;
  // Walk back from the end to find the last time the path was behind.
  let lastBehind = -1;
  for (let i = n - 1; i >= 0; i--) {
    if (diff(i) < 0) {
      lastBehind = i;
      break;
    }
  }
  if (lastBehind === -1) return { age: path[0].age, yearsAfterGraduation: path[0].age - graduationAge };
  const d0 = diff(lastBehind);
  const d1 = diff(lastBehind + 1);
  const frac = d1 === d0 ? 0 : -d0 / (d1 - d0);
  const age = path[lastBehind].age + frac;
  return { age, yearsAfterGraduation: age - graduationAge };
}

/** Earnings given up by attending college instead of working (after tax). */
export function calculateOpportunityCost(yearsInCollege: number, noCollege: ProjectionRow[] = projectNoCollege()): number {
  return noCollege.slice(0, yearsInCollege).reduce((s, r) => s + r.afterTaxEarnings, 0);
}
