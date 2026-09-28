/**
 * Teaching models. Deliberately simpler than the full path model so every
 * number can be checked by hand: pre-tax, no loans, college paid as you go.
 * Used by the opportunity-cost demonstration and the economics lessons.
 */

export interface TwoStudentsInputs {
  /** Net college cost per year (tuition + living, after aid). */
  costPerYear: number;
  yearsInCollege: number;
  /** Starting salary after graduating. */
  graduateSalary: number;
  /** Annual real raise for the graduate, e.g. 0.04. */
  graduateGrowth: number;
  /** Starting salary for the student who works from 18. */
  workerSalary: number;
  /** Annual real raise for the worker. */
  workerGrowth: number;
  startAge?: number;
  horizonAge?: number;
}

export interface TwoStudentsRow {
  age: number;
  /** Student A (college): cumulative earnings minus college costs. */
  a: number;
  /** Student B (works from 18): cumulative earnings. */
  b: number;
}

export function twoStudents(inp: TwoStudentsInputs): TwoStudentsRow[] {
  const start = inp.startAge ?? 18;
  const end = inp.horizonAge ?? 40;
  const rows: TwoStudentsRow[] = [{ age: start, a: 0, b: 0 }];
  let a = 0;
  let b = 0;
  let gradSalary = inp.graduateSalary;
  let workSalary = inp.workerSalary;
  for (let age = start; age < end; age++) {
    const yearIndex = age - start;
    if (yearIndex < inp.yearsInCollege) a -= inp.costPerYear;
    else {
      a += gradSalary;
      gradSalary *= 1 + inp.graduateGrowth;
    }
    b += workSalary;
    workSalary *= 1 + inp.workerGrowth;
    rows.push({ age: age + 1, a, b });
  }
  return rows;
}

/** First age (interpolated) at which series `a` overtakes `b` for good, or null. */
export function crossingAge(rows: Array<{ age: number; a: number; b: number }>): number | null {
  const n = rows.length;
  if (n === 0 || rows[n - 1].a < rows[n - 1].b) return null;
  let lastBehind = -1;
  for (let i = n - 1; i >= 0; i--) {
    if (rows[i].a < rows[i].b) {
      lastBehind = i;
      break;
    }
  }
  if (lastBehind === -1) return rows[0].age;
  const d0 = rows[lastBehind].a - rows[lastBehind].b;
  const d1 = rows[lastBehind + 1].a - rows[lastBehind + 1].b;
  const f = d1 === d0 ? 0 : -d0 / (d1 - d0);
  return rows[lastBehind].age + f * (rows[lastBehind + 1].age - rows[lastBehind].age);
}

/** Opportunity cost of college in this model: what the worker earns while the student studies, plus what college costs. */
export function opportunityCostOf(inp: TwoStudentsInputs): { foregoneEarnings: number; directCost: number; total: number } {
  let foregone = 0;
  let s = inp.workerSalary;
  for (let i = 0; i < inp.yearsInCollege; i++) {
    foregone += s;
    s *= 1 + inp.workerGrowth;
  }
  const direct = inp.costPerYear * inp.yearsInCollege;
  return { foregoneEarnings: foregone, directCost: direct, total: foregone + direct };
}

/** Future value of a lump sum at a constant annual return, year by year (compounding). */
export function compoundSeries(principal: number, annualRate: number, years: number): number[] {
  const out = [principal];
  for (let t = 1; t <= years; t++) out.push(out[t - 1] * (1 + annualRate));
  return out;
}

/**
 * A loan balance left unpaid: interest added to the balance each year
 * (capitalized). Shows why deferred debt grows.
 */
export function deferredBalance(principal: number, ratePct: number, years: number): number[] {
  return compoundSeries(principal, ratePct / 100, years);
}

/** Mean vs median of a right-skewed sample (why "average salary" misleads). */
export function meanAndMedian(values: number[]): { mean: number; median: number } {
  if (values.length === 0) return { mean: 0, median: 0 };
  const sorted = [...values].sort((x, y) => x - y);
  const mid = sorted.length >> 1;
  const median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  return { mean: values.reduce((s, v) => s + v, 0) / values.length, median };
}
