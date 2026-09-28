/**
 * Calculation engine (spec §63). Public API:
 *
 *   calculateNetCost, calculateLoanPayment, calculateTotalInterest,
 *   projectSalary, adjustForInflation, adjustForCostOfLiving,
 *   calculateCumulativeEarnings, calculateOpportunityCost,
 *   calculateBreakEvenYear
 *
 * plus the path model (projectPath / projectNoCollege) that composes them,
 * timeline snapshots (timeline.ts), the teaching models (opportunity.ts) and
 * the seeded Monte Carlo run (simulation.ts).
 *
 * Nothing in lib/calc knows about animation or rendering.
 */
export * from "./cost";
export * from "./loans";
export * from "./taxes";
export * from "./earnings";
export * from "./projection";
export * from "./timeline";
export * from "./opportunity";
export * from "./simulation";
export * from "./whatif";
export * from "./disposable";
