import { describe, expect, it } from "vitest";
import { moneyCompact } from "@/lib/format";
import { calculateBreakEvenYear, cumulativeSeries, projectNoCollege, projectPath } from "@/lib/calc";
import { contextFor } from "@/features/scenario/data";
import { breakEvenYears, primaryFacts, whatThisMeans, yrs } from "@/features/scenario/facts";
import type { Future } from "@/features/scenario/store";
import type { PathSel } from "@/features/scenario/types";

function future(sel: PathSel): Future {
  const ctx = contextFor(sel.collegeId, sel.majorId)!;
  const result = projectPath(
    { collegeId: sel.collegeId, majorId: sel.majorId, residency: sel.residency, living: sel.living, yearsToGraduate: 4, funding: { aidPerYear: sel.aid, scholarshipsPerYear: 0, familyPerYear: 10000, workPerYear: 3000, savings: 0 } },
    ctx,
    { horizonAge: 40 },
  );
  const base = projectNoCollege({ horizonAge: 40, stateRate: ctx.collegeCity?.stateTaxRate });
  const be = calculateBreakEvenYear(result.rows, base, result.graduationAge);
  return { index: 0, sel, ctx, result, series: cumulativeSeries(result.rows, 40), breakEven: be && be.age > 18 ? be.age : null, label: "" };
}

describe("overview number formatting", () => {
  it("rounds to whole thousands from $10K up, keeps one decimal below", () => {
    expect(moneyCompact(59_500)).toBe("$60K");
    expect(moneyCompact(84_237.49)).toBe("$84K");
    expect(moneyCompact(5_450)).toBe("$5.5K");
    expect(moneyCompact(999_700)).toBe("$1M");
    expect(moneyCompact(1_240_000)).toBe("$1.2M");
    expect(moneyCompact(-12_400)).toBe("−$12K");
  });
  it("labels break-even in years, or says it never happens", () => {
    expect(yrs(7.44)).toBe("7.4 yrs");
    expect(yrs(null)).toBe("Not by 40");
  });
});

describe("plain-language facts", () => {
  const f = future({ collegeId: "uc-berkeley", majorId: "economics", residency: "resident", aid: 15000, living: "campus" });

  it("gives exactly five primary metrics in the journey's order", () => {
    expect(primaryFacts(f).map((x) => x.key)).toEqual(["cost", "debt", "pay", "jobs", "breakeven"]);
  });

  it("reports debt as the amount borrowed (the same figure /compare shows)", () => {
    const debt = primaryFacts(f).find((x) => x.key === "debt")!;
    expect(debt.raw).toBe(f.result.loan.principal);
    expect(f.result.loan.principal).toBeCloseTo(f.result.net.borrowing, 6);
  });

  it("measures break-even from graduation", () => {
    expect(breakEvenYears(f)).toBeCloseTo(f.breakEven! - f.result.graduationAge, 6);
  });

  it("explains the result in two short sentences with no raw precision", () => {
    const text = whatThisMeans(f);
    expect(text).toMatch(/In-state tuition/);
    expect(text.split(/(?<=\.)\s/).length).toBeLessThanOrEqual(3);
    expect(text).not.toMatch(/\$\d{1,3},\d{3}/);
  });

  it("changes its wording for out-of-state and private paths", () => {
    expect(whatThisMeans(future({ collegeId: "uc-berkeley", majorId: "economics", residency: "nonresident", aid: 0, living: "campus" }))).toMatch(/Out-of-state tuition/);
    expect(whatThisMeans(future({ collegeId: "nyu", majorId: "finance", residency: "resident", aid: 30000, living: "campus" }))).toMatch(/private college/);
  });
});
