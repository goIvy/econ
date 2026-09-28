/**
 * Take-home pay: 2024 federal brackets (single filer, standard deduction),
 * payroll taxes, and an approximate effective state + local rate.
 */
export const STANDARD_DEDUCTION_2024 = 14600;

const BRACKETS_2024: Array<[number, number]> = [
  [11600, 0.1],
  [47150, 0.12],
  [100525, 0.22],
  [191950, 0.24],
  [243725, 0.32],
  [609350, 0.35],
  [Infinity, 0.37],
];

export const SOCIAL_SECURITY_WAGE_BASE_2024 = 168600;

export function federalIncomeTax(gross: number): number {
  let taxable = Math.max(0, gross - STANDARD_DEDUCTION_2024);
  let tax = 0;
  let lower = 0;
  for (const [upper, rate] of BRACKETS_2024) {
    if (taxable <= 0) break;
    const slice = Math.min(taxable, upper - lower);
    tax += slice * rate;
    taxable -= slice;
    lower = upper;
  }
  return tax;
}

export function payrollTax(gross: number): number {
  return Math.min(gross, SOCIAL_SECURITY_WAGE_BASE_2024) * 0.062 + gross * 0.0145;
}

export function stateIncomeTax(gross: number, effectiveRate: number): number {
  return Math.max(0, gross - STANDARD_DEDUCTION_2024) * effectiveRate;
}

export function totalTax(gross: number, stateRate = 0.045): number {
  if (gross <= 0) return 0;
  return federalIncomeTax(gross) + payrollTax(gross) + stateIncomeTax(gross, stateRate);
}

export function afterTax(gross: number, stateRate = 0.045): number {
  return Math.max(0, gross - totalTax(gross, stateRate));
}
