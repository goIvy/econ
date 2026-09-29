import type { Confidence, DataSource, Lineage, SourceId } from "@/types";

/**
 * Registry of every dataset College Value Lab draws on. While the app runs on
 * seeded data, lineage records point at the dataset each value *will* come
 * from and carry `demo: true`.
 */
export const SOURCES: Record<SourceId, DataSource> = {
  "scorecard-inst": {
    id: "scorecard-inst",
    publisher: "U.S. Department of Education",
    name: "College Scorecard",
    dataset: "Institution-level data (Most Recent Cohorts)",
    url: "https://collegescorecard.ed.gov/data/",
    methodologyId: "net-cost",
    quality: 0.9,
  },
  "scorecard-fos": {
    id: "scorecard-fos",
    publisher: "U.S. Department of Education",
    name: "College Scorecard",
    dataset: "Field-of-study earnings (Most Recent Cohorts)",
    url: "https://collegescorecard.ed.gov/data/",
    methodologyId: "earnings",
    quality: 0.85,
  },
  "ipeds-cost": {
    id: "ipeds-cost",
    publisher: "National Center for Education Statistics",
    name: "IPEDS",
    dataset: "Institutional Characteristics: cost of attendance",
    url: "https://nces.ed.gov/ipeds/",
    methodologyId: "total-cost",
    quality: 0.95,
  },
  "ipeds-grad": {
    id: "ipeds-grad",
    publisher: "National Center for Education Statistics",
    name: "IPEDS",
    dataset: "Graduation Rates (150% and 100% of normal time)",
    url: "https://nces.ed.gov/ipeds/",
    methodologyId: "graduation",
    quality: 0.95,
  },
  "ipeds-enroll": {
    id: "ipeds-enroll",
    publisher: "National Center for Education Statistics",
    name: "IPEDS",
    dataset: "Fall Enrollment; Admissions",
    url: "https://nces.ed.gov/ipeds/",
    methodologyId: "institution",
    quality: 0.95,
  },
  "bls-oews": {
    id: "bls-oews",
    publisher: "U.S. Bureau of Labor Statistics",
    name: "Occupational Employment and Wage Statistics",
    dataset: "National occupational wages (May release)",
    url: "https://www.bls.gov/oes/",
    methodologyId: "earnings",
    quality: 0.95,
  },
  "bls-ep": {
    id: "bls-ep",
    publisher: "U.S. Bureau of Labor Statistics",
    name: "Employment Projections",
    dataset: "Occupational projections, 10-year horizon",
    url: "https://www.bls.gov/emp/",
    methodologyId: "employment",
    quality: 0.85,
  },
  "acs-major": {
    id: "acs-major",
    publisher: "U.S. Census Bureau",
    name: "American Community Survey",
    dataset: "Earnings by field of bachelor's degree (PUMS)",
    url: "https://www.census.gov/programs-surveys/acs/microdata.html",
    methodologyId: "earnings",
    quality: 0.85,
  },
  "nyfed-grads": {
    id: "nyfed-grads",
    publisher: "Federal Reserve Bank of New York",
    name: "Labor Market for Recent College Graduates",
    dataset: "Outcomes by major (ACS-based)",
    url: "https://www.newyorkfed.org/research/college-labor-market",
    methodologyId: "employment",
    quality: 0.85,
  },
  "bea-rpp": {
    id: "bea-rpp",
    publisher: "U.S. Bureau of Economic Analysis",
    name: "Regional Price Parities",
    dataset: "RPP by metropolitan area, all items",
    url: "https://www.bea.gov/data/prices-inflation/regional-price-parities-state-and-metro-area",
    methodologyId: "purchasing-power",
    quality: 0.9,
  },
  "fsa-rates": {
    id: "fsa-rates",
    publisher: "Federal Student Aid",
    name: "Federal student loan interest rates",
    dataset: "Direct Loan rates for loans first disbursed 2024-25",
    url: "https://studentaid.gov/understand-aid/types/loans/interest-rates",
    methodologyId: "loans",
    quality: 1,
  },
  "fred-cpi": {
    id: "fred-cpi",
    publisher: "Federal Reserve Bank of St. Louis",
    name: "FRED",
    dataset: "CPI-U, all items (CPIAUCSL)",
    url: "https://fred.stlouisfed.org/series/CPIAUCSL",
    methodologyId: "inflation",
    quality: 1,
  },
  "irs-brackets": {
    id: "irs-brackets",
    publisher: "Internal Revenue Service",
    name: "Federal income tax brackets",
    dataset: "Tax year 2024, single filer",
    url: "https://www.irs.gov/filing/federal-income-tax-rates-and-brackets",
    methodologyId: "taxes",
    quality: 1,
  },
  "cvl-model": {
    id: "cvl-model",
    publisher: "College Value Lab",
    name: "College Value Lab model",
    dataset: "Calculated from the inputs and datasets listed in the methodology",
    url: "/methodology",
    methodologyId: "break-even",
    quality: 0.7,
  },
};

export const DEMO_UPDATED = "2026-09-01";

/**
 * Confidence from sample size, data age, source quality and coverage
 * (spec §55). Transparent, not a black box: the weights are documented on
 * the methodology page.
 */
export function scoreConfidence(input: {
  sampleSize?: number;
  dataYear: number;
  quality: number;
  coverage?: number;
  now?: number;
}): Confidence {
  const now = input.now ?? 2026;
  const n = input.sampleSize ?? 1000;
  const sample = n >= 500 ? 1 : n >= 100 ? 0.75 : n >= 30 ? 0.45 : 0.15;
  const age = Math.max(0, now - input.dataYear);
  const fresh = age <= 2 ? 1 : age <= 4 ? 0.7 : 0.4;
  const coverage = input.coverage ?? 1;
  const score = sample * 0.35 + fresh * 0.2 + input.quality * 0.25 + coverage * 0.2;
  if (score >= 0.8) return "high";
  if (score >= 0.6) return "moderate";
  return "limited";
}

/** Build a lineage record for seeded data. */
export function lineage(
  sourceId: SourceId,
  year: number | string,
  population: string,
  opts: { sampleSize?: number; coverage?: number; note?: string } = {},
): Lineage {
  const dataYear = typeof year === "number" ? year : parseInt(String(year).slice(0, 4), 10) + 1;
  return {
    sourceId,
    year: String(year),
    population,
    lastUpdated: DEMO_UPDATED,
    sampleSize: opts.sampleSize,
    coverage: opts.coverage,
    confidence: scoreConfidence({
      sampleSize: opts.sampleSize,
      dataYear,
      quality: SOURCES[sourceId].quality,
      coverage: opts.coverage,
    }),
    demo: true,
    note: opts.note,
  };
}
