/**
 * Total cost model (spec §12) and living arrangement (spec §13).
 * All amounts are annual USD in 2024 dollars unless noted.
 */
import type { City, College, FundingInputs, LivingArrangement, Residency } from "@/types";

export type CostKey = "tuition" | "fees" | "housing" | "food" | "books" | "transportation" | "misc";

export interface CostLine {
  key: CostKey;
  label: string;
  perYear: number;
}

export const COST_LABELS: Record<CostKey, string> = {
  tuition: "Tuition",
  fees: "Fees",
  housing: "Housing",
  food: "Food",
  books: "Books & supplies",
  transportation: "Transportation",
  misc: "Personal & other",
};

/** Share of a 1-bedroom rent a student typically pays off campus (shared housing). */
export const OFF_CAMPUS_RENT_SHARE = 0.6;
/** Months of off-campus rent per academic year (lease runs through summer). */
export const OFF_CAMPUS_RENT_MONTHS = 12;

/** Annual tuition for a residency status. Private colleges charge everyone the same. */
export function tuitionFor(college: College, residency: Residency): number {
  const c = college.costs;
  if (college.control === "public" && residency === "nonresident") return c.tuitionOutOfState.value ?? 0;
  return c.tuitionInState.value ?? 0;
}

/**
 * Cost lines for one academic year. Living arrangement changes housing,
 * food and transportation:
 *  - campus: the college's published room and board
 *  - off-campus: a share of local 1-bedroom rent; groceries at ~85% of board
 *  - home: no rent; food at ~35% of board; commuting at ~2.2× the allowance
 */
export function annualCostLines(
  college: College,
  residency: Residency,
  living: LivingArrangement,
  city?: City | null,
): CostLine[] {
  const c = college.costs;
  const room = c.room.value ?? 0;
  const board = c.board.value ?? 0;
  const transport = c.transportation.value ?? 0;
  const rent = city?.rent1br.value ?? room / 12 / OFF_CAMPUS_RENT_SHARE;

  const housing =
    living === "campus" ? room : living === "off-campus" ? Math.round(rent * OFF_CAMPUS_RENT_SHARE * OFF_CAMPUS_RENT_MONTHS) : 0;
  const food = living === "campus" ? board : living === "off-campus" ? Math.round(board * 0.85) : Math.round(board * 0.35);
  const transportation = living === "campus" ? transport : living === "off-campus" ? Math.round(transport * 1.4) : Math.round(transport * 2.2);

  const lines: Array<[CostKey, number]> = [
    ["tuition", tuitionFor(college, residency)],
    ["fees", c.fees.value ?? 0],
    ["housing", housing],
    ["food", food],
    ["books", c.books.value ?? 0],
    ["transportation", transportation],
    ["misc", c.misc.value ?? 0],
  ];
  return lines.map(([key, perYear]) => ({ key, label: COST_LABELS[key], perYear }));
}

export function sumLines(lines: CostLine[]): number {
  return lines.reduce((s, l) => s + l.perYear, 0);
}

/** Gross cost over the whole enrollment. */
export function calculateGrossCost(lines: CostLine[], years: number): number {
  return sumLines(lines) * years;
}

export interface NetCostBreakdown {
  years: number;
  grossPerYear: number;
  gross: number;
  aid: number;
  scholarships: number;
  family: number;
  /** Gross − grants − scholarships: what the household pays in total. */
  netPrice: number;
  /** Net price − family contribution. */
  netStudentCost: number;
  work: number;
  savings: number;
  /** Amount still to cover after work and savings: estimated borrowing. */
  borrowing: number;
  /** When grants/contributions exceed cost, the unused amount (not income). */
  surplus: number;
}

/**
 * Gross cost − Aid − Scholarships − Family contribution = Net student cost.
 * Work income and savings then reduce the amount to borrow.
 * Grants and scholarships are capped at gross cost (aid can't exceed cost of attendance).
 */
export function calculateNetCost(grossPerYear: number, years: number, funding: FundingInputs): NetCostBreakdown {
  const safeYears = Math.max(0, years);
  const gross = grossPerYear * safeYears;
  const aid = Math.min(gross, Math.max(0, funding.aidPerYear) * safeYears);
  const scholarships = Math.min(gross - aid, Math.max(0, funding.scholarshipsPerYear) * safeYears);
  const netPrice = gross - aid - scholarships;
  const family = Math.min(netPrice, Math.max(0, funding.familyPerYear) * safeYears);
  const netStudentCost = netPrice - family;
  const work = Math.min(netStudentCost, Math.max(0, funding.workPerYear) * safeYears);
  const savings = Math.min(netStudentCost - work, Math.max(0, funding.savings));
  const borrowing = Math.max(0, netStudentCost - work - savings);
  const contributed = Math.max(0, funding.aidPerYear) * safeYears + Math.max(0, funding.scholarshipsPerYear) * safeYears + Math.max(0, funding.familyPerYear) * safeYears + Math.max(0, funding.workPerYear) * safeYears + Math.max(0, funding.savings);
  return {
    years: safeYears,
    grossPerYear,
    gross,
    aid,
    scholarships,
    family,
    netPrice,
    netStudentCost,
    work,
    savings,
    borrowing,
    surplus: Math.max(0, contributed - gross),
  };
}
