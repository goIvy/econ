/**
 * Calculation engine (spec §63). Public API:
 *
 *   calculateNetCost, calculateLoanPayment, calculateTotalInterest,
 *   projectSalary, adjustForInflation, adjustForCostOfLiving,
 *   calculateCumulativeEarnings, calculateOpportunityCost,
 *   calculateBreakEvenYear
 *
 * plus the path model (projectPath / projectNoCollege) that composes them.
 * run_scenario_simulation / run_monte_carlo_simulation belong to later
 * releases (spec §28–30) and are intentionally not implemented yet.
 */
export * from "./cost";
export * from "./loans";
export * from "./taxes";
export * from "./earnings";
export * from "./projection";
