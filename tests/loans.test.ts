import { describe, expect, it } from "vitest";
import {
  calculateInSchoolInterest, calculateLoanPayment, calculateTotalInterest, loanSchedule, summarizeLoan,
} from "@/lib/calc";

describe("loan payment", () => {
  it("matches the standard amortization formula", () => {
    // $30,000 at 6.53% over 10 years → $341.07/month
    expect(calculateLoanPayment(30000, 6.53, 10)).toBeCloseTo(341.07, 1);
  });
  it("handles a zero interest rate", () => {
    expect(calculateLoanPayment(12000, 0, 10)).toBeCloseTo(100, 6);
  });
  it("returns 0 for no principal or no term", () => {
    expect(calculateLoanPayment(0, 6.53, 10)).toBe(0);
    expect(calculateLoanPayment(10000, 6.53, 0)).toBe(0);
  });
  it("total interest = payments − principal", () => {
    const p = calculateLoanPayment(30000, 6.53, 10);
    expect(calculateTotalInterest(30000, 6.53, 10)).toBeCloseTo(p * 120 - 30000, 6);
  });
});

describe("in-school interest", () => {
  it("is zero for subsidized federal loans", () => {
    expect(calculateInSchoolInterest(20000, 6.53, 4, "federal-subsidized")).toBe(0);
  });
  it("accrues simple interest on each year's disbursement plus a 6-month grace", () => {
    // 4 slices of 2,500 outstanding 4.5, 3.5, 2.5, 1.5 years at 5%
    expect(calculateInSchoolInterest(10000, 5, 4, "federal-unsubsidized")).toBeCloseTo(1500, 6);
  });
});

describe("debt curve", () => {
  it("starts at the principal, ends at zero, one point per year", () => {
    const s = loanSchedule(25000, 6.53, 10);
    expect(s).toHaveLength(11);
    expect(s[0].balance).toBe(25000);
    expect(s[10].balance).toBeCloseTo(0, 6);
    for (let i = 1; i < s.length; i++) expect(s[i].balance).toBeLessThan(s[i - 1].balance);
  });
  it("summary adds capitalized interest to the repayment balance", () => {
    const sum = summarizeLoan({ principal: 10000, ratePct: 5, type: "federal-unsubsidized", termYears: 10 }, 4);
    expect(sum.repaymentBalance).toBeCloseTo(11500, 6);
    expect(sum.totalRepayment).toBeCloseTo(sum.monthlyPayment * 120, 4);
    expect(sum.totalInterest).toBeCloseTo(sum.totalRepayment - 10000, 4);
    expect(sum.payoffYears).toBe(10);
  });
});
