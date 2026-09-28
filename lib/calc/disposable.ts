/**
 * Disposable income: what's left of a salary after taxes, rent, core living
 * costs and loan payments. Used by the What-If Lab and the cost-of-living
 * explorer.
 */
import { afterTax } from "./taxes";

/**
 * Non-housing essentials for one adult at US-average prices (food,
 * transportation, health care, utilities, personal), per year.
 * SAMPLE ASSUMPTION, shaped like BLS Consumer Expenditure Survey single-person
 * spending; scaled by the local price level.
 */
export const CORE_EXPENSES_US = 20400;

export interface DisposableBreakdown {
  salary: number;
  taxes: number;
  rent: number;
  core: number;
  loan: number;
  disposable: number;
}

export function calculateDisposableIncome(opts: { salary: number; stateRate: number; rentPerMonth: number; rpp?: number; loanPerYear?: number }): DisposableBreakdown {
  const net = afterTax(opts.salary, opts.stateRate);
  const rent = opts.rentPerMonth * 12;
  const core = (CORE_EXPENSES_US * (opts.rpp ?? 100)) / 100;
  const loan = opts.loanPerYear ?? 0;
  return { salary: opts.salary, taxes: opts.salary - net, rent, core, loan, disposable: net - rent - core - loan };
}

/**
 * Purchasing power: the salary in `toRpp` that buys what `salary` buys in
 * `fromRpp` (regional price parities, US = 100).
 */
export function calculatePurchasingPower(salary: number, fromRpp: number, toRpp: number): number {
  return (salary * toRpp) / fromRpp;
}
