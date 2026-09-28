import { describe, expect, it } from "vitest";
import {
  calculateLoanPayment,
  compoundSeries,
  crossingAge,
  debtAt,
  deferredBalance,
  drawSalary,
  meanAndMedian,
  milestonesFor,
  opportunityCostOf,
  projectNoCollege,
  rng,
  runMonteCarlo,
  snapshotAt,
  twoStudents,
} from "@/lib/calc";
import { runPath } from "@/services/data";

const base = { costPerYear: 30000, yearsInCollege: 4, graduateSalary: 70000, graduateGrowth: 0.04, workerSalary: 32000, workerGrowth: 0.02 };

describe("two students (opportunity cost teaching model)", () => {
  it("student A goes negative during college while B accumulates", () => {
    const rows = twoStudents(base);
    const at22 = rows.find((r) => r.age === 22)!;
    expect(at22.a).toBe(-120000);
    expect(at22.b).toBeGreaterThan(130000);
  });
  it("finds a crossing that moves later when college costs more", () => {
    const cheap = crossingAge(twoStudents(base))!;
    const pricey = crossingAge(twoStudents({ ...base, costPerYear: 60000 }))!;
    expect(cheap).toBeGreaterThan(22);
    expect(pricey).toBeGreaterThan(cheap);
  });
  it("returns null when the graduate never catches up", () => {
    expect(crossingAge(twoStudents({ ...base, graduateSalary: 30000, graduateGrowth: 0.02 }))).toBeNull();
  });
  it("borrowing eases the college years but costs interest later", () => {
    const cash = twoStudents(base);
    const loan = twoStudents({ ...base, debt: 40000 });
    expect(loan.find((r) => r.age === 22)!.a).toBe(-80000);
    expect(loan.at(-1)!.a).toBeLessThan(cash.at(-1)!.a);
    // Total interest paid is the gap at the end.
    const interest = calculateLoanPayment(40000, 6.53, 10) * 120 - 40000;
    expect(cash.at(-1)!.a - loan.at(-1)!.a).toBeCloseTo(interest, 6);
  });
  it("opportunity cost is foregone earnings plus direct cost", () => {
    const oc = opportunityCostOf(base);
    expect(oc.directCost).toBe(120000);
    expect(oc.foregoneEarnings).toBeCloseTo(32000 * (1 + 1.02 + 1.02 ** 2 + 1.02 ** 3), 6);
    expect(oc.total).toBeCloseTo(oc.directCost + oc.foregoneEarnings, 6);
  });
});

describe("compounding helpers", () => {
  it("compounds annually", () => {
    const s = compoundSeries(20000, 0.05, 10);
    expect(s).toHaveLength(11);
    expect(s[10]).toBeCloseTo(20000 * 1.05 ** 10, 6);
  });
  it("deferred debt grows at the loan rate", () => {
    expect(deferredBalance(10000, 6.53, 1)[1]).toBeCloseTo(10653, 6);
  });
  it("mean exceeds median for a right-skewed sample", () => {
    const { mean, median } = meanAndMedian([40, 45, 50, 55, 60, 300]);
    expect(median).toBe(52.5);
    expect(mean).toBeGreaterThan(median);
  });
});

describe("timeline snapshots", () => {
  const r = runPath({ collegeId: "uc-berkeley", majorId: "economics", residency: "resident", living: "campus", yearsToGraduate: 4, funding: { aidPerYear: 15000, scholarshipsPerYear: 0, familyPerYear: 10000, workPerYear: 3000, savings: 0 }, options: { horizonAge: 40 } })!;
  it("is zero at the start and matches year-end rows", () => {
    expect(snapshotAt(r.result, r.baseline, 18).netPosition).toBe(0);
    const row = r.result.rows.find((x) => x.age === 29)!;
    expect(snapshotAt(r.result, r.baseline, 30).netPosition).toBeCloseTo(row.cumulative, 6);
  });
  it("interpolates between year-ends", () => {
    const a = snapshotAt(r.result, r.baseline, 30).netPosition;
    const b = snapshotAt(r.result, r.baseline, 31).netPosition;
    const mid = snapshotAt(r.result, r.baseline, 30.5).netPosition;
    expect(mid).toBeCloseTo((a + b) / 2, 6);
  });
  it("debt builds in college, peaks at graduation and reaches zero after the term", () => {
    expect(debtAt(r.result, 18.5)).toBeLessThan(debtAt(r.result, 21.5));
    expect(debtAt(r.result, r.result.graduationAge)).toBeCloseTo(r.result.loan.repaymentBalance, 6);
    expect(debtAt(r.result, r.result.graduationAge + 10)).toBe(0);
  });
  it("milestones come from the model", () => {
    const m = milestonesFor(r.result, r.baseline, 40);
    expect(m[0].label).toBe("Start college");
    expect(m.some((x) => x.label === "Graduate" && x.age === 22)).toBe(true);
    expect(m.at(-1)!.age).toBe(40);
  });
});

describe("Monte Carlo", () => {
  const r = runPath({ collegeId: "uc-berkeley", majorId: "economics", residency: "resident", living: "campus", yearsToGraduate: 4, funding: { aidPerYear: 15000, scholarshipsPerYear: 0, familyPerYear: 10000, workPerYear: 3000, savings: 0 }, options: { horizonAge: 40 } })!;
  const ctx = { college: r.college, major: r.major, outcome: r.outcome, collegeCity: r.collegeCity, careerCity: r.careerCity };
  it("is deterministic for a seed", () => {
    const a = runMonteCarlo(r.result.inputs, ctx, { runs: 200, seed: 7, horizonAge: 40 });
    const b = runMonteCarlo(r.result.inputs, ctx, { runs: 200, seed: 7, horizonAge: 40 });
    expect(a.median).toBe(b.median);
    expect(a.runs).toHaveLength(200);
  });
  it("orders its bands and keeps probabilities in range", () => {
    const s = runMonteCarlo(r.result.inputs, ctx, { runs: 400, horizonAge: 40 });
    const last = s.ages.length - 1;
    expect(s.bands.p10[last]).toBeLessThanOrEqual(s.bands.p50[last]);
    expect(s.bands.p50[last]).toBeLessThanOrEqual(s.bands.p90[last]);
    expect(s.downside).toBeLessThan(s.upside);
    expect(s.recoverWithin10).toBeGreaterThanOrEqual(0);
    expect(s.recoverWithin10 + s.neverRecover).toBeLessThanOrEqual(1);
    expect(s.baseline).toHaveLength(projectNoCollege({ horizonAge: 40 }).length);
  });
  it("salary draws centre on the median", () => {
    const rand = rng(1);
    const p = { p10: 50000, p25: 62000, p50: 75000, p75: 92000, p90: 115000 };
    const draws = Array.from({ length: 4000 }, () => drawSalary(p, rand)).sort((x, y) => x - y);
    expect(draws[2000]).toBeGreaterThan(70000);
    expect(draws[2000]).toBeLessThan(80000);
  });
});

import { calculateDisposableIncome, impliedGrowth, afterTax, projectPath as pp } from "@/lib/calc";

describe("disposable income, inflation, implied growth", () => {
  it("subtracts taxes, rent, core costs and loans", () => {
    const d = calculateDisposableIncome({ salary: 80000, stateRate: 0.05, rentPerMonth: 1500, rpp: 100, loanPerYear: 6000 });
    expect(d.disposable).toBeCloseTo(afterTax(80000, 0.05) - 18000 - 20400 - 6000, 6);
    expect(d.taxes).toBeGreaterThan(0);
  });
  it("scales core costs by local prices", () => {
    const a = calculateDisposableIncome({ salary: 80000, stateRate: 0, rentPerMonth: 0, rpp: 120 });
    const b = calculateDisposableIncome({ salary: 80000, stateRate: 0, rentPerMonth: 0, rpp: 90 });
    expect(b.disposable - a.disposable).toBeCloseTo(20400 * 0.3, 6);
  });
  it("implied growth reaches mid-career in 15 years", () => {
    const g = impliedGrowth(50000, 80000);
    expect(50000 * Math.pow(1 + g, 15)).toBeCloseTo(80000, 4);
  });
  it("inflation shrinks real loan payments and raises net value", () => {
    const r = runPath({ collegeId: "nyu", majorId: "finance", residency: "resident", living: "campus", yearsToGraduate: 4, funding: { aidPerYear: 20000, scholarshipsPerYear: 0, familyPerYear: 10000, workPerYear: 3000, savings: 0 }, options: { horizonAge: 40 } })!;
    const ctx = { college: r.college, major: r.major, outcome: r.outcome, collegeCity: r.collegeCity, careerCity: r.careerCity };
    const base = pp(r.result.inputs, ctx, { horizonAge: 40 });
    const infl = pp(r.result.inputs, ctx, { horizonAge: 40, inflation: 0.03 });
    expect(infl.rows.at(-1)!.cumulative).toBeGreaterThan(base.rows.at(-1)!.cumulative);
    expect(base.rows.at(-1)!.cumulative).toBeCloseTo(r.result.rows.at(-1)!.cumulative, 6);
  });
});
