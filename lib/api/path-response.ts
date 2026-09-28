import type { Lineage, SalaryPercentiles } from "@/types";
import type { CostLine, NetCostBreakdown, BalancePoint } from "@/lib/calc";

/** What /api/path returns: everything the UI needs, nothing it doesn't. */
export interface PathResponse {
  college: { id: string; name: string; shortName: string; control: "public" | "private"; state: string; city: string };
  major: { id: string; name: string };
  residency: "resident" | "nonresident";
  living: "campus" | "off-campus" | "home";
  costLines: CostLine[];
  net: NetCostBreakdown;
  loan: { principal: number; monthlyPayment: number; totalInterest: number; totalRepayment: number; payoffYears: number; ratePct: number; schedule: BalancePoint[] };
  startingSalary: number;
  percentiles: SalaryPercentiles | null;
  employmentRate: number;
  tenYearEarnings: number;
  graduationAge: number;
  breakEven: { age: number; yearsAfterGraduation: number } | null;
  series: Array<{ age: number; cumulative: number }>;
  baseline: Array<{ age: number; cumulative: number }>;
  isFallback: boolean;
  gradRate4: number | null;
  gradRate6: number | null;
  lineage: {
    netCost: Lineage;
    earnings: Lineage;
    employment: Lineage;
    loanRate: Lineage;
    model: Lineage;
    gradRate: Lineage;
  };
}
