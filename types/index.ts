/**
 * Domain types. The frontend depends only on these shapes, never on where the
 * data comes from, so seeded data (data/seed) can be swapped for the FastAPI
 * service (backend/) without touching components.
 */

// ---------------------------------------------------------------- lineage

export type SourceId =
  | "scorecard-inst"
  | "scorecard-fos"
  | "ipeds-cost"
  | "ipeds-grad"
  | "ipeds-enroll"
  | "bls-oews"
  | "bls-ep"
  | "acs-major"
  | "nyfed-grads"
  | "bea-rpp"
  | "fsa-rates"
  | "fred-cpi"
  | "irs-brackets"
  | "cvl-model";

export interface DataSource {
  id: SourceId;
  /** Publisher, e.g. "U.S. Department of Education". */
  publisher: string;
  /** Product name, e.g. "College Scorecard". */
  name: string;
  /** Specific dataset / table. */
  dataset: string;
  url: string;
  /** Methodology id (see data/methodologies.ts). */
  methodologyId: string;
  /** How reliable the source is, 0–1, used in confidence scoring. */
  quality: number;
}

export type Confidence = "high" | "moderate" | "limited";

/** Everything the "View source" footnote shows. */
export interface Lineage {
  sourceId: SourceId;
  /** Data year shown to users, e.g. 2024 or "2022–23". */
  year: string;
  /** Population the statistic describes. */
  population: string;
  lastUpdated: string; // ISO date
  sampleSize?: number;
  /** Fraction of the expected population covered, 0–1. */
  coverage?: number;
  confidence: Confidence;
  /** True while the value is seeded demo data rather than a live dataset. */
  demo: boolean;
  note?: string;
}

/** A value plus where it came from. `value: null` means no data exists. */
export interface Metric<T = number> {
  value: T | null;
  lineage: Lineage;
}

// ---------------------------------------------------------------- entities

export type Control = "public" | "private";
export type Residency = "resident" | "nonresident";
export type LivingArrangement = "campus" | "off-campus" | "home";

export interface CollegeCosts {
  tuitionInState: Metric;
  tuitionOutOfState: Metric;
  fees: Metric;
  /** On-campus room (housing) per year. */
  room: Metric;
  /** On-campus board (meal plan) per year. */
  board: Metric;
  books: Metric;
  transportation: Metric;
  misc: Metric;
  /** Average net price after grant aid (all students). */
  netPrice: Metric;
}

export interface CollegeAid {
  /** Share of students receiving grant aid. */
  pctReceivingGrants: Metric;
  /** Average grant/scholarship aid among recipients, per year. */
  avgGrant: Metric;
  /** Share of students borrowing federal loans. */
  pctBorrowing: Metric;
}

export interface TrendPoint {
  year: number;
  tuitionInState: number;
  tuitionOutOfState: number;
  netPrice: number;
}

export interface College {
  id: string; // slug
  unitId: string; // IPEDS unit id (demo ids while seeded)
  name: string;
  shortName: string;
  city: string;
  state: string; // USPS code
  control: Control;
  undergradEnrollment: Metric;
  acceptanceRate: Metric;
  costs: CollegeCosts;
  aid: CollegeAid;
  gradRate4: Metric;
  gradRate6: Metric;
  medianDebt: Metric;
  /** Institution-wide median earnings 10 years after entry. */
  medianEarnings: Metric;
  /** Relative earnings premium vs. national median for the same major, ~0.8–1.35. */
  earningsFactor: number;
  majorIds: string[];
  trends: TrendPoint[];
  /** Closest metro for cost-of-living lookups. */
  cityId: string;
}

export interface SalaryPercentiles {
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
}

export interface OccupationShare {
  occupationId: string;
  share: number; // 0–1
}

export interface IndustryShare {
  industry: string;
  share: number; // 0–1
}

export interface Major {
  id: string;
  name: string;
  cip: string; // CIP 2020 code
  category: MajorCategory;
  /** National early-career (age 22–27) percentiles, annual USD. */
  earlyCareer: Metric<SalaryPercentiles>;
  /** National mid-career (age 35–45) median. */
  midCareerMedian: Metric;
  employmentRate: Metric;
  unemploymentRate: Metric;
  /** Share of recent grads in jobs that don't typically require a degree. */
  underemploymentRate: Metric;
  gradSchoolRate: Metric;
  /** Median months from graduation to first full-time job, when defensible data exists. */
  monthsToFirstJob: Metric;
  occupations: OccupationShare[];
  industries: IndustryShare[];
  blurb: string;
}

export type MajorCategory =
  | "Engineering & computing"
  | "Business & economics"
  | "Math & physical sciences"
  | "Life & health sciences"
  | "Social sciences"
  | "Humanities & arts"
  | "Applied & professional";

export interface Occupation {
  id: string;
  soc: string;
  title: string;
  medianWage: Metric;
  /** Projected employment growth over 10 years, percent. */
  growth10yr: Metric;
  typicalEducation: string;
  /** Metros with the highest concentration of these jobs. */
  topMetros: string[];
  category: string;
}

export interface City {
  id: string;
  name: string;
  state: string;
  /** Regional price parity, all items (US = 100). */
  rpp: Metric;
  /** Median gross rent, 1-bedroom, per month. */
  rent1br: Metric;
  /** Approximate effective state + local income tax rate on a typical salary, 0–1. */
  stateTaxRate: number;
}

/** A college-major combination with field-of-study outcomes. */
export interface CollegeMajorOutcome {
  collegeId: string;
  majorId: string;
  /** Field-of-study early-career percentiles; null when the program doesn't report. */
  earlyCareer: Metric<SalaryPercentiles>;
  midCareerMedian: Metric;
  employmentRate: Metric;
  /** True when field-of-study data was missing and the institution-wide fallback is used. */
  isFallback: boolean;
}

// ---------------------------------------------------------------- scenarios

export interface FundingInputs {
  /** Need-based grant aid per year. */
  aidPerYear: number;
  /** Scholarships per year. */
  scholarshipsPerYear: number;
  /** Family contribution per year. */
  familyPerYear: number;
  /** Student work income per year (work-study, part-time jobs). */
  workPerYear: number;
  /** One-time savings applied to college. */
  savings: number;
}

export type LoanType = "federal-subsidized" | "federal-unsubsidized" | "parent-plus" | "private";

export interface LoanInputs {
  principal: number;
  /** Annual interest rate, percent (e.g. 6.53). */
  ratePct: number;
  type: LoanType;
  termYears: number;
}

export interface PathInputs {
  collegeId: string;
  majorId: string;
  residency: Residency;
  living: LivingArrangement;
  funding: FundingInputs;
  /** Years to graduate (4 by default). */
  yearsToGraduate: number;
  /** Where the student expects to work after graduating (city id). */
  careerCityId?: string;
}
