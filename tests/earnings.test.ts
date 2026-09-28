import { describe, expect, it } from "vitest";
import {
  adjustForCostOfLiving, adjustForInflation, afterTax, calculateBreakEvenYear, calculateCumulativeEarnings,
  calculateOpportunityCost, equivalentSalary, federalIncomeTax, projectNoCollege, projectSalary, YEARS_TO_MID_CAREER,
  type ProjectionRow,
} from "@/lib/calc";

describe("salary projection", () => {
  it("starts at the starting salary and reaches the mid-career median", () => {
    const s = projectSalary({ start: 60000, midCareer: 100000, years: 25 });
    expect(s[0]).toBe(60000);
    expect(s[YEARS_TO_MID_CAREER]).toBeCloseTo(100000, 0);
    expect(s[24]).toBeGreaterThan(s[YEARS_TO_MID_CAREER]);
  });
  it("honors a growth override", () => {
    const s = projectSalary({ start: 50000, midCareer: 90000, years: 3, growthOverride: 0.1 });
    expect(s[2]).toBeCloseTo(60500, 6);
  });
  it("cumulative earnings are a running total", () => {
    expect(calculateCumulativeEarnings([1, 2, 3])).toEqual([1, 3, 6]);
  });
});

describe("cost of living and inflation", () => {
  it("adjusts salary by regional price parity", () => {
    expect(adjustForCostOfLiving(110000, 118)).toBeCloseTo(93220.34, 1);
  });
  it("finds equivalent purchasing power between cities", () => {
    expect(equivalentSalary(110000, 118, 101)).toBeCloseTo(94152.54, 1);
  });
  it("discounts future dollars", () => {
    expect(adjustForInflation(110, 1, 0.1)).toBeCloseTo(100, 6);
  });
});

describe("taxes", () => {
  it("applies 2024 brackets after the standard deduction", () => {
    // taxable 35,400: 10% × 11,600 + 12% × 23,800
    expect(federalIncomeTax(50000)).toBeCloseTo(1160 + 2856, 6);
  });
  it("take-home pay is below gross and non-negative", () => {
    expect(afterTax(50000, 0)).toBeLessThan(50000);
    expect(afterTax(0)).toBe(0);
  });
});

const row = (age: number, cumulative: number): ProjectionRow => ({ age, phase: "career", earnings: 0, afterTaxEarnings: 0, collegeOutlay: 0, loanPayment: 0, net: 0, cumulative });

describe("break-even", () => {
  it("interpolates the crossing point", () => {
    const path = [row(22, -100), row(23, -50), row(24, 50), row(25, 150)];
    const alt = [row(22, 0), row(23, 0), row(24, 0), row(25, 0)];
    const be = calculateBreakEvenYear(path, alt, 22)!;
    expect(be.age).toBeCloseTo(23.5, 6);
    expect(be.yearsAfterGraduation).toBeCloseTo(1.5, 6);
  });
  it("returns null when the path never overtakes", () => {
    expect(calculateBreakEvenYear([row(22, -5), row(23, -1)], [row(22, 0), row(23, 0)], 22)).toBeNull();
  });
  it("uses the last crossing when paths cross more than once", () => {
    const path = [row(22, 1), row(23, -1), row(24, 1)];
    const alt = [row(22, 0), row(23, 0), row(24, 0)];
    expect(calculateBreakEvenYear(path, alt, 22)!.age).toBeCloseTo(23.5, 6);
  });
});

describe("opportunity cost", () => {
  it("is the after-tax earnings given up during college", () => {
    const base = projectNoCollege();
    expect(calculateOpportunityCost(4, base)).toBeCloseTo(base.slice(0, 4).reduce((s, r) => s + r.afterTaxEarnings, 0), 6);
  });
});
