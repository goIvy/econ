/**
 * Student-loan model (spec §14). Standard amortization, the same formula as the
 * federal Standard Repayment Plan.
 */
import type { LoanInputs, LoanType } from "@/types";

/** Rates for loans first disbursed 2024–25 (Federal Student Aid). Private is an editable assumption. */
export const DEFAULT_RATES: Record<LoanType, number> = {
  "federal-subsidized": 6.53,
  "federal-unsubsidized": 6.53,
  "parent-plus": 9.08,
  private: 8.5,
};

export const LOAN_TYPE_LABELS: Record<LoanType, string> = {
  "federal-subsidized": "Federal Direct Subsidized",
  "federal-unsubsidized": "Federal Direct Unsubsidized",
  "parent-plus": "Parent PLUS",
  private: "Private loan",
};

/** Whether interest builds up while the student is enrolled. */
export function accruesInSchool(type: LoanType): boolean {
  return type !== "federal-subsidized";
}

/** Fixed monthly payment that retires `principal` over `termYears`. */
export function calculateLoanPayment(principal: number, ratePct: number, termYears: number): number {
  if (principal <= 0 || termYears <= 0) return 0;
  const n = Math.round(termYears * 12);
  const r = ratePct / 100 / 12;
  if (r === 0) return principal / n;
  return (principal * r) / (1 - Math.pow(1 + r, -n));
}

/** Interest paid over the repayment term (excluding any in-school interest). */
export function calculateTotalInterest(principal: number, ratePct: number, termYears: number): number {
  const payment = calculateLoanPayment(principal, ratePct, termYears);
  return Math.max(0, payment * Math.round(termYears * 12) - principal);
}

/**
 * Interest that builds up before repayment when the principal is borrowed in
 * equal slices at the start of each school year, plus a 6-month grace period.
 * It is added to the balance (capitalized) when repayment begins.
 */
export function calculateInSchoolInterest(principal: number, ratePct: number, yearsInSchool: number, type: LoanType): number {
  if (!accruesInSchool(type) || principal <= 0 || yearsInSchool <= 0) return 0;
  const slice = principal / yearsInSchool;
  const r = ratePct / 100;
  let interest = 0;
  for (let i = 0; i < yearsInSchool; i++) {
    const yearsOutstanding = yearsInSchool - i + 0.5; // + grace period
    interest += slice * r * yearsOutstanding; // simple interest while in school (federal rule)
  }
  return interest;
}

export interface BalancePoint {
  /** Years since repayment began. */
  year: number;
  balance: number;
  interestPaid: number;
  principalPaid: number;
}

/** Year-end remaining balance over the repayment term (the debt curve). */
export function loanSchedule(principal: number, ratePct: number, termYears: number): BalancePoint[] {
  const payment = calculateLoanPayment(principal, ratePct, termYears);
  const r = ratePct / 100 / 12;
  const months = Math.round(termYears * 12);
  let balance = principal;
  let interestYear = 0;
  let principalYear = 0;
  const points: BalancePoint[] = [{ year: 0, balance: principal, interestPaid: 0, principalPaid: 0 }];
  for (let m = 1; m <= months; m++) {
    const interest = balance * r;
    const toPrincipal = Math.min(balance, payment - interest);
    balance = Math.max(0, balance - toPrincipal);
    interestYear += interest;
    principalYear += toPrincipal;
    if (m % 12 === 0 || m === months) {
      points.push({ year: Math.ceil(m / 12), balance, interestPaid: interestYear, principalPaid: principalYear });
      interestYear = 0;
      principalYear = 0;
    }
  }
  return points;
}

export interface LoanSummary {
  principal: number;
  inSchoolInterest: number;
  /** Balance when repayment starts. */
  repaymentBalance: number;
  monthlyPayment: number;
  /** In-school interest + repayment interest. */
  totalInterest: number;
  totalRepayment: number;
  payoffYears: number;
  schedule: BalancePoint[];
}

export function summarizeLoan(input: LoanInputs, yearsInSchool = 4): LoanSummary {
  const principal = Math.max(0, input.principal);
  const inSchoolInterest = calculateInSchoolInterest(principal, input.ratePct, yearsInSchool, input.type);
  const repaymentBalance = principal + inSchoolInterest;
  const monthlyPayment = calculateLoanPayment(repaymentBalance, input.ratePct, input.termYears);
  const repaymentInterest = calculateTotalInterest(repaymentBalance, input.ratePct, input.termYears);
  return {
    principal,
    inSchoolInterest,
    repaymentBalance,
    monthlyPayment,
    totalInterest: inSchoolInterest + repaymentInterest,
    totalRepayment: principal + inSchoolInterest + repaymentInterest,
    payoffYears: principal > 0 ? input.termYears : 0,
    schedule: loanSchedule(repaymentBalance, input.ratePct, input.termYears),
  };
}
