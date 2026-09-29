/**
 * Plain-language methodology entries. Every lineage record points at one of
 * these via its source; the methodology modal and page render them.
 */
export interface Methodology {
  id: string;
  title: string;
  /** One-sentence plain-language definition shown in tooltips. */
  simple: string;
  /** Longer explanation for the methodology page. */
  body: string[];
  /** Formula, when there is one. */
  formula?: string;
  limitations?: string[];
}

export const METHODOLOGIES: Methodology[] = [
  {
    id: "total-cost",
    title: "Total cost of attendance",
    simple: "Everything a year of college costs: tuition, fees, housing, food, books, transportation and personal expenses.",
    body: [
      "We start from the cost of attendance each college reports to IPEDS: tuition and fees, on-campus room and board, books and supplies, transportation, and other personal expenses.",
      "Public colleges charge different tuition to residents and non-residents, so the residency toggle swaps the tuition line and recalculates everything downstream.",
      "Living arrangement changes the housing, food and transportation lines. Campus housing uses the college's published room and board. Off-campus uses the local rent level. Living at home removes rent, lowers food costs and raises transportation.",
    ],
    formula: "Gross cost = (tuition + fees + housing + food + books + transportation + other) × years enrolled",
  },
  {
    id: "net-cost",
    title: "Net cost",
    simple: "What your family actually pays after grants and scholarships, which don't need to be repaid.",
    body: [
      "Grant aid and scholarships reduce the price. Loans do not: they are a way to pay, and they come back later with interest.",
      "Net price is what the household pays in total. Net student cost is what remains after the family's contribution. Work income and savings cover part of it, and anything left is the estimated amount to borrow.",
    ],
    formula: "Net student cost = Gross cost − Aid − Scholarships − Family contribution\nEstimated borrowing = max(0, Net student cost − Work income − Savings)",
  },
  {
    id: "loans",
    title: "Loan payments",
    simple: "The fixed monthly payment that pays a loan off over its term, and how much interest that adds.",
    body: [
      "We use standard amortization, the same formula federal loan servicers use for the Standard Repayment Plan.",
      "Unsubsidized and private loans build up interest while you're in school. That interest is added to the balance when repayment begins. Subsidized federal loans don't build up interest while you're enrolled at least half-time.",
      "Federal rates are the ones set for loans first disbursed in 2024-25. Private loan rates vary by lender and credit, so the private default is an assumption you can change.",
    ],
    formula: "Payment = P × r / (1 − (1 + r)^−n), where r is the monthly rate and n the number of months",
  },
  {
    id: "earnings",
    title: "Salary estimates",
    simple: "Earnings of past graduates, shown as a range (10th to 90th percentile), not a single promise.",
    body: [
      "Early-career earnings come from College Scorecard field-of-study data where a program reports it, and from national earnings by major (American Community Survey) otherwise.",
      "We show five points of the distribution because averages hide how different outcomes can be. Half of graduates earn less than the median.",
      "Projections beyond the observed years grow earnings toward the mid-career median for the major. They are estimates, labeled as such, in 2024 dollars.",
    ],
    limitations: [
      "Scorecard earnings cover students who received federal aid, which may not represent every student.",
      "Earnings reflect past graduates in past labor markets.",
    ],
  },
  {
    id: "graduation",
    title: "Graduation probability",
    simple: "The share of past students who finished within 4 or 6 years. It describes the institution, not you.",
    body: [
      "IPEDS reports the share of first-time, full-time students who completed a bachelor's degree within 100% (4 years) and 150% (6 years) of normal time.",
      "This is based on historical outcomes for students at this institution and does not predict any individual student with certainty.",
    ],
  },
  {
    id: "employment",
    title: "Employment outcomes",
    simple: "How often recent graduates in a major are employed, unemployed, or in jobs that don't typically need a degree.",
    body: [
      "Employment and unemployment rates by major come from the New York Fed's analysis of recent college graduates (ages 22-27) in the American Community Survey.",
      "Underemployment means working in a job that typically doesn't require a bachelor's degree. We show it only where the data is defensible.",
      "Occupation growth rates come from the BLS Employment Projections program.",
    ],
  },
  {
    id: "institution",
    title: "Institution profile",
    simple: "Enrollment, admissions and control (public or private) as reported to the federal government.",
    body: ["Undergraduate enrollment and acceptance rates come from IPEDS Fall Enrollment and Admissions surveys."],
  },
  {
    id: "purchasing-power",
    title: "Purchasing power",
    simple: "The same salary buys more in some places than others. We adjust using regional price levels.",
    body: [
      "Regional Price Parities (RPP) from the Bureau of Economic Analysis measure how prices in a metro area compare with the national average (100).",
      "An adjusted salary divides by the RPP: $110,000 in a metro with RPP 118 buys about what $93,200 buys in an average-priced place.",
    ],
    formula: "Adjusted salary = Salary × 100 / RPP",
  },
  {
    id: "inflation",
    title: "Inflation",
    simple: "All figures are in 2024 dollars, so values in different years are directly comparable.",
    body: ["Projections are made in constant 2024 dollars using CPI-U. Nominal future values would be higher, but so would prices."],
  },
  {
    id: "taxes",
    title: "Taxes",
    simple: "Take-home pay estimates subtract federal income tax, payroll taxes and an approximate state income tax.",
    body: [
      "Federal tax uses 2024 single-filer brackets with the standard deduction. Payroll taxes (Social Security and Medicare) are 7.65%. State and local income tax uses an approximate effective rate for the chosen work location.",
    ],
  },
  {
    id: "break-even",
    title: "Break-even",
    simple: "Approximately how long it takes for the extra earnings from a path to recover its higher cost.",
    body: [
      "We track cumulative net value for each path: after-tax earnings, minus money paid for college, minus loan payments.",
      "The comparison path is the next alternative: another college path, or starting work at 18 with a high-school diploma. The break-even point is where one path's cumulative value overtakes the other's and stays ahead.",
      "Break-even is an estimate that depends on every assumption above. It is not a prediction for any one person.",
    ],
    limitations: [
      "Students who attend selective colleges may have earned more regardless of where they enrolled (selection bias).",
      "Correlation between a college and earnings does not prove the college caused those earnings.",
    ],
  },
  {
    id: "opportunity-cost",
    title: "Opportunity cost",
    simple: "What you give up by choosing one option: here, the wages you could have earned instead of attending college.",
    body: [
      "The no-college comparison path starts working at 18 at the typical wage for a recent high-school graduate. Those foregone earnings are part of college's real cost.",
    ],
  },
];

export const LIMITATIONS: string[] = [
  "Salary data does not guarantee personal outcomes.",
  "College choice is affected by student characteristics: the same student might earn similar amounts at different colleges.",
  "Correlation is not causation.",
  "Selective colleges may enroll students who would have earned more regardless.",
  "Not all programs publish equally complete data.",
  "Geographic assumptions matter: where you work changes both pay and prices.",
  "Estimates depend on the input assumptions you choose.",
];

export function getMethodology(id: string): Methodology | undefined {
  return METHODOLOGIES.find((m) => m.id === id);
}
