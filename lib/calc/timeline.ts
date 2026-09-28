/**
 * Reading a projected path at any moment in time (the Financial Timeline).
 * Pure functions: given a PathResult, answer "where does this path stand at
 * age X?" with interpolation between year-ends so a scrubber can move smoothly.
 */
import type { PathResult, ProjectionRow } from "./projection";
import { calculateBreakEvenYear } from "./projection";

export interface TimelineSnapshot {
  age: number;
  phase: "college" | "career";
  /** Annual pre-tax salary at this age (0 while in college). */
  salary: number;
  /** Loan balance still owed. */
  remainingDebt: number;
  /** Pre-tax earnings since graduation (expected, after the employment rate). */
  cumulativeEarnings: number;
  /** Cumulative net financial value: after-tax earnings minus college costs and loan payments. */
  netPosition: number;
  /** The no-college path's cumulative value at the same age. */
  baselinePosition: number;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Value of a year-end series at a fractional age (linear between year-ends, 0 before the start). */
function seriesAt(rows: ProjectionRow[], age: number, pick: (r: ProjectionRow) => number): number {
  if (rows.length === 0) return 0;
  const start = rows[0].age;
  // Row i holds the value at the END of age `start + i`, so the curve starts at 0 at `start`.
  const t = age - start;
  if (t <= 0) return 0;
  const i = Math.min(rows.length - 1, Math.floor(t) - 1);
  const prev = i < 0 ? 0 : pick(rows[i]);
  if (Math.floor(t) >= rows.length) return pick(rows[rows.length - 1]);
  const next = pick(rows[Math.floor(t)]);
  return lerp(prev, next, t - Math.floor(t));
}

/** Loan balance at a fractional age: borrowed as you go in college, then amortized. */
export function debtAt(result: PathResult, age: number): number {
  const { loan, graduationAge, inputs } = result;
  const years = Math.max(1, inputs.yearsToGraduate);
  const start = graduationAge - years;
  if (loan.principal <= 0 || age <= start) return 0;
  if (age < graduationAge) {
    // One slice borrowed at the start of each school year.
    return loan.principal * Math.min(1, (Math.floor(age - start) + 1) / years);
  }
  const t = age - graduationAge;
  const s = loan.schedule;
  const i = Math.floor(t);
  if (i >= s.length - 1) return 0;
  return lerp(s[i].balance, s[i + 1].balance, t - i);
}

export function snapshotAt(result: PathResult, baseline: ProjectionRow[], age: number): TimelineSnapshot {
  const inCollege = age < result.graduationAge;
  const careerRows = result.rows.filter((r) => r.phase === "career");
  const salaryRow = careerRows.find((r) => r.age === Math.floor(age));
  const salary = inCollege ? 0 : (salaryRow?.earnings ?? careerRows[careerRows.length - 1]?.earnings ?? 0) / (result.employmentRate || 1);
  let cumulativeEarnings = 0;
  for (const r of careerRows) {
    if (r.age + 1 <= age) cumulativeEarnings += r.earnings;
    else if (r.age < age) cumulativeEarnings += r.earnings * (age - r.age);
  }
  return {
    age,
    phase: inCollege ? "college" : "career",
    salary,
    remainingDebt: debtAt(result, age),
    cumulativeEarnings,
    netPosition: seriesAt(result.rows, age, (r) => r.cumulative),
    baselinePosition: seriesAt(baseline, age, (r) => r.cumulative),
  };
}

export interface Milestone {
  age: number;
  label: string;
  detail: string;
}

/** Milestones derived from the model, not hard-coded ages. */
export function milestonesFor(result: PathResult, baseline: ProjectionRow[], horizonAge: number): Milestone[] {
  const out: Milestone[] = [{ age: result.rows[0]?.age ?? 18, label: "Start college", detail: "Costs begin; earnings mostly pause." }];
  out.push({ age: result.graduationAge, label: "Graduate", detail: "Loan repayment starts after a 6-month grace period." });
  out.push({ age: result.graduationAge + 1, label: "First full year of work", detail: "Starting salary for this major and college." });
  if (result.loan.principal > 0) {
    out.push({ age: result.graduationAge + result.loan.payoffYears, label: "Debt paid off", detail: `${result.loan.payoffYears}-year standard repayment.` });
  }
  const be = calculateBreakEvenYear(result.rows, baseline, result.graduationAge);
  if (be && be.age > (result.rows[0]?.age ?? 18)) out.push({ age: Math.round(be.age * 10) / 10, label: "Break-even", detail: "Cumulative value passes the no-college path." });
  for (const a of [30, 35]) if (a < horizonAge && !out.some((m) => Math.abs(m.age - a) < 1.5)) out.push({ age: a, label: `Age ${a}`, detail: a === 30 ? "Career growth" : "Long-term earnings" });
  out.push({ age: horizonAge, label: `Age ${horizonAge}`, detail: "Cumulative financial outcome" });
  return out.filter((m) => m.age <= horizonAge).sort((a, b) => a.age - b.age);
}

/** College costs paid out of pocket (not borrowed) by a fractional age. */
export function outOfPocketBy(result: PathResult, age: number): number {
  let total = 0;
  for (const r of result.rows) {
    if (r.age + 1 <= age) total += r.collegeOutlay;
    else if (r.age < age) total += r.collegeOutlay * (age - r.age);
  }
  return total;
}

/**
 * Cumulative value as an evenly spaced series starting at 0 at `startAge`
 * (row i holds the value at the end of age startAge + i).
 */
export function cumulativeSeries(rows: ProjectionRow[], toAge: number): number[] {
  const start = rows[0]?.age ?? 18;
  const out = [0];
  for (const r of rows) {
    if (r.age + 1 > toAge) break;
    out.push(r.cumulative);
  }
  while (out.length < toAge - start + 1) out.push(out[out.length - 1]);
  return out;
}
