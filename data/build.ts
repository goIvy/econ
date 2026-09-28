/**
 * Builds typed, lineage-tagged entities from the seed rows. This file is the
 * only place that knows the data is seeded; `services/data.ts` exposes it
 * behind async accessors that a live API can replace.
 */
import type {
  City, College, CollegeMajorOutcome, Major, Occupation, SalaryPercentiles, TrendPoint,
} from "@/types";
import { lineage } from "./sources";
import { COLLEGE_ROWS } from "./seed/colleges";
import { MAJOR_ROWS, INDUSTRY_PROFILES } from "./seed/majors";
import { OCCUPATION_ROWS } from "./seed/occupations";
import { CITY_ROWS } from "./seed/cities";

// ---------------------------------------------------------------- utilities

/** Deterministic hash → [0, 1). Same id always yields the same derived values. */
export function hash01(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 13;
  h = Math.imul(h, 0x5bd1e995);
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

const round = (n: number, to = 100) => Math.round(n / to) * to;

/** Lognormal percentiles around a median. z-scores for 10/25/75/90. */
export function percentilesFromMedian(median: number, sigma: number): SalaryPercentiles {
  const at = (z: number) => round(median * Math.exp(z * sigma));
  return { p10: at(-1.2816), p25: at(-0.6745), p50: round(median), p75: at(0.6745), p90: at(1.2816) };
}

// ---------------------------------------------------------------- cities

export const CITIES: City[] = CITY_ROWS.map(([id, name, state, rpp, rent, tax]) => ({
  id,
  name,
  state,
  rpp: { value: rpp, lineage: lineage("bea-rpp", 2022, "All items, metropolitan statistical area") },
  rent1br: { value: rent, lineage: lineage("acs-major", 2023, "Renter-occupied 1-bedroom units, median gross rent", { sampleSize: 4000 }) },
  stateTaxRate: tax,
}));

const cityById = new Map(CITIES.map((c) => [c.id, c]));

// ---------------------------------------------------------------- occupations

export const OCCUPATIONS: Occupation[] = OCCUPATION_ROWS.map(([id, soc, title, wage, growth, edu, category, metros]) => ({
  id,
  soc,
  title,
  medianWage: { value: wage, lineage: lineage("bls-oews", 2023, "All workers in occupation, national", { sampleSize: 5000 }) },
  growth10yr: { value: growth, lineage: lineage("bls-ep", "2023–33", "Projected employment change, national") },
  typicalEducation: edu,
  topMetros: metros,
  category,
}));

// ---------------------------------------------------------------- majors

export const MAJORS: Major[] = MAJOR_ROWS.map((row) => {
  const [id, name, cip, category, early, mid, unemp, underemp, grad, sigma, months, occ, profile, blurb] = row;
  const pop = "Recent graduates aged 22–27 with a bachelor's degree in this major";
  return {
    id,
    name,
    cip,
    category,
    earlyCareer: { value: percentilesFromMedian(early, sigma), lineage: lineage("acs-major", 2023, pop, { sampleSize: 2500 }) },
    midCareerMedian: { value: mid, lineage: lineage("acs-major", 2023, "Graduates aged 35–45 with a bachelor's degree in this major", { sampleSize: 4000 }) },
    unemploymentRate: { value: unemp, lineage: lineage("nyfed-grads", 2024, pop, { sampleSize: 2500 }) },
    employmentRate: { value: Math.round((100 - unemp) * 10) / 10, lineage: lineage("nyfed-grads", 2024, `${pop}, in the labor force`, { sampleSize: 2500 }) },
    underemploymentRate: { value: underemp, lineage: lineage("nyfed-grads", 2024, pop, { sampleSize: 2500, note: "Share working in jobs that typically do not require a bachelor's degree." }) },
    gradSchoolRate: { value: grad, lineage: lineage("acs-major", 2023, "Bachelor's holders in this major who later earned a graduate degree", { sampleSize: 4000 }) },
    monthsToFirstJob: months == null
      ? { value: null, lineage: lineage("cvl-model", 2024, "No defensible source") }
      : { value: months, lineage: lineage("nyfed-grads", 2024, pop, { sampleSize: 600, coverage: 0.6, note: "Estimated from survey-based job-search durations; treat as approximate." }) },
    occupations: occ.split(",").map((pair) => {
      const [occupationId, share] = pair.split(":");
      return { occupationId, share: parseFloat(share) };
    }),
    industries: INDUSTRY_PROFILES[profile].map(([industry, share]) => ({ industry, share })),
    blurb,
  };
});

const majorById = new Map(MAJORS.map((m) => [m.id, m]));

// ---------------------------------------------------------------- colleges

/** Majors every comprehensive college offers in the demo dataset. */
const CORE = [
  "economics", "business-administration", "accounting", "finance", "marketing", "psychology", "biology",
  "english", "history", "political-science", "sociology", "mathematics", "computer-science", "chemistry",
  "communications", "philosophy", "physics",
];
const ENGINEERING = [
  "computer-engineering", "electrical-engineering", "mechanical-engineering", "chemical-engineering",
  "civil-engineering", "aerospace-engineering", "industrial-engineering", "biomedical-engineering",
];
const OPTIONAL = MAJORS.map((m) => m.id).filter((id) => !CORE.includes(id) && !ENGINEERING.includes(id) && id !== "nursing");
const LIBERAL_ARTS = [
  "economics", "psychology", "biology", "english", "history", "political-science", "sociology", "mathematics",
  "computer-science", "chemistry", "philosophy", "physics", "music", "fine-arts", "international-relations",
  "environmental-science", "anthropology", "neuroscience", "biochemistry", "public-health", "statistics-data-science",
];
const BUSINESS = ["business-administration", "accounting", "finance", "marketing", "business-analytics", "mis", "supply-chain", "economics", "hospitality"];
const TECH = ["computer-science", "mathematics", "physics", "chemistry", "biology", "economics", "statistics-data-science", "information-technology", "biochemistry", "neuroscience", "architecture", "business-analytics", "mis"];

function majorsFor(id: string, tags: string): string[] {
  if (tags === "L") return LIBERAL_ARTS;
  if (tags === "B") {
    // business-focused schools also carry a small set of arts & sciences
    return [...BUSINESS, "psychology", "communications", "english", "political-science", "mathematics", "computer-science"];
  }
  const set = new Set(tags.includes("T") ? TECH : CORE);
  if (tags.includes("E")) ENGINEERING.forEach((m) => set.add(m));
  if (tags.includes("N")) set.add("nursing");
  if (tags.includes("B")) BUSINESS.forEach((m) => set.add(m));
  if (!tags.includes("T")) {
    for (const m of OPTIONAL) if (hash01(`${id}:${m}`) < 0.62) set.add(m);
  }
  return [...set].filter((m) => majorById.has(m));
}

const NATIONAL_MEDIAN_EARNINGS = 58000;

export const COLLEGES: College[] = COLLEGE_ROWS.map((row, index) => {
  const [id, name, shortName, city, state, ctl, enroll, accept, tIn, tOut, rb, g6, debt, earn, cityId, tags] = row;
  const control = ctl === "U" ? "public" : "private";
  const h = (k: string) => hash01(`${id}:${k}`);
  const elite = accept <= 12;

  const room = round(rb * 0.58);
  const board = round(rb * 0.42);
  const books = round(1000 + h("books") * 500, 10);
  const transportation = round(900 + h("transport") * 900, 10);
  const misc = round(1800 + h("misc") * 1400, 10);
  const fees = round((control === "public" ? 1200 : 1800) + h("fees") * 1200, 10);
  const tuitionIn = tIn - fees;
  const tuitionOut = tOut - fees;

  const coaIn = tIn + rb + books + transportation + misc;
  const pctGrants = control === "private" ? (elite ? 0.58 : 0.86) : 0.58 + h("pct") * 0.2;
  const avgGrant = round(control === "private" ? tIn * (elite ? 0.78 : 0.48) : tIn * 0.55 + 2500);
  const netPrice = round(Math.max(12000, coaIn - avgGrant));

  const g4Gap = control === "private" ? (100 - g6) * 0.6 + 3 : (100 - g6) * 0.9 + 10;
  const g4 = Math.max(8, Math.round(g6 - g4Gap));

  const trends: TrendPoint[] = [];
  const growth = control === "public" ? 0.028 : 0.036;
  for (let y = 2019; y <= 2024; y++) {
    const back = Math.pow(1 + growth, 2024 - y);
    trends.push({ year: y, tuitionInState: round(tIn / back), tuitionOutOfState: round(tOut / back), netPrice: round(netPrice / Math.pow(1 + growth * 0.8, 2024 - y)) });
  }

  const ipedsCost = (label: string) => lineage("ipeds-cost", "2023–24", `Full-time, first-time undergraduates; ${label}`, { sampleSize: enroll });
  const cohort = Math.round(enroll / 4.2);

  return {
    id,
    unitId: `DEMO-${String(100000 + index * 137).padStart(6, "0")}`,
    name,
    shortName,
    city,
    state,
    control,
    undergradEnrollment: { value: enroll, lineage: lineage("ipeds-enroll", 2023, "Undergraduate headcount, fall", { sampleSize: enroll }) },
    acceptanceRate: { value: accept, lineage: lineage("ipeds-enroll", 2023, "First-time degree-seeking applicants", { sampleSize: enroll * 3 }) },
    costs: {
      tuitionInState: { value: tuitionIn, lineage: ipedsCost(control === "public" ? "in-state tuition" : "tuition") },
      tuitionOutOfState: { value: tuitionOut, lineage: ipedsCost(control === "public" ? "out-of-state tuition" : "tuition") },
      fees: { value: fees, lineage: ipedsCost("required fees") },
      room: { value: room, lineage: ipedsCost("on-campus room") },
      board: { value: board, lineage: ipedsCost("on-campus board") },
      books: { value: books, lineage: ipedsCost("books and supplies") },
      transportation: { value: transportation, lineage: ipedsCost("transportation allowance") },
      misc: { value: misc, lineage: ipedsCost("other personal expenses") },
      netPrice: { value: netPrice, lineage: lineage("scorecard-inst", "2022–23", "Title IV students receiving grant aid, all income levels", { sampleSize: Math.round(cohort * 0.6) }) },
    },
    aid: {
      pctReceivingGrants: { value: Math.round(pctGrants * 100), lineage: lineage("scorecard-inst", "2022–23", "Full-time, first-time undergraduates") },
      avgGrant: { value: avgGrant, lineage: lineage("ipeds-cost", "2022–23", "Grant recipients, average grant and scholarship aid", { sampleSize: Math.round(cohort * pctGrants) }) },
      pctBorrowing: { value: Math.round((control === "private" ? (elite ? 0.14 : 0.45) : 0.34) * 100 + h("borrow") * 12), lineage: lineage("scorecard-inst", "2022–23", "Undergraduates receiving federal loans") },
    },
    gradRate4: { value: g4, lineage: lineage("ipeds-grad", "2017 cohort", "First-time, full-time bachelor's-seeking students; completion within 4 years", { sampleSize: cohort }) },
    gradRate6: { value: g6, lineage: lineage("ipeds-grad", "2017 cohort", "First-time, full-time bachelor's-seeking students; completion within 6 years", { sampleSize: cohort }) },
    medianDebt: { value: debt, lineage: lineage("scorecard-inst", "2022–23", "Undergraduate completers with federal loans", { sampleSize: Math.round(cohort * 0.4) }) },
    medianEarnings: { value: earn, lineage: lineage("scorecard-inst", "2021–22", "Federally aided students, 10 years after entry", { sampleSize: Math.round(cohort * 0.5) }) },
    earningsFactor: Math.min(1.35, Math.max(0.8, Math.pow(earn / NATIONAL_MEDIAN_EARNINGS, 0.6))),
    majorIds: majorsFor(id, tags),
    trends,
    cityId: cityById.has(cityId) ? cityId : "chi",
  };
});

const collegeById = new Map(COLLEGES.map((c) => [c.id, c]));

// ---------------------------------------------------------------- college × major

/**
 * Field-of-study outcomes. About 1 in 9 programs has no reportable
 * field-of-study earnings (small cohorts are suppressed); those fall back to
 * the national major distribution scaled by the institution's earnings level
 * and are flagged `isFallback`.
 */
export function buildOutcome(collegeId: string, majorId: string): CollegeMajorOutcome | null {
  const college = collegeById.get(collegeId);
  const major = majorById.get(majorId);
  if (!college || !major || !college.majorIds.includes(majorId)) return null;

  const h = hash01(`${collegeId}×${majorId}`);
  const suppressed = h < 0.11 && !["economics", "business-administration", "computer-science", "psychology", "biology"].includes(majorId);
  const factor = college.earningsFactor * (0.94 + hash01(`${majorId}×${collegeId}`) * 0.12);
  const national = major.earlyCareer.value!;
  const cohortSize = Math.round((college.undergradEnrollment.value! / 4.5) * (0.004 + h * 0.05));

  const scaledMedian = national.p50 * factor;
  const sigma = Math.log(national.p90 / national.p50) / 1.2816;
  const early = percentilesFromMedian(scaledMedian, sigma * (suppressed ? 1.05 : 0.95));

  const fosPop = `Federally aided graduates of this program, earnings 4 years after completion (inflation-adjusted to 2024)`;
  return {
    collegeId,
    majorId,
    earlyCareer: suppressed
      ? { value: early, lineage: lineage("acs-major", 2023, "National graduates in this major, scaled by this institution's earnings level", { sampleSize: 2500, coverage: 0.5, note: "No field-of-study salary data is available for this program; showing an institution-adjusted national estimate." }) }
      : { value: early, lineage: lineage("scorecard-fos", "2020–21 completers", fosPop, { sampleSize: Math.max(12, cohortSize), coverage: 0.7 }) },
    midCareerMedian: { value: round(major.midCareerMedian.value! * factor), lineage: lineage("cvl-model", 2024, "National mid-career median for the major, scaled by institution earnings level", { note: "Projection, not observed for this program." }) },
    employmentRate: { value: Math.min(99, Math.round((major.employmentRate.value! + (factor - 1) * 3) * 10) / 10), lineage: major.employmentRate.lineage },
    isFallback: suppressed,
  };
}
