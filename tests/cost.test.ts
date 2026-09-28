import { describe, expect, it } from "vitest";
import { annualCostLines, calculateGrossCost, calculateNetCost, sumLines, tuitionFor } from "@/lib/calc";
import { COLLEGES, CITIES } from "@/data/build";

const berkeley = COLLEGES.find((c) => c.id === "uc-berkeley")!;
const nyu = COLLEGES.find((c) => c.id === "nyu")!;
const sf = CITIES.find((c) => c.id === "sf")!;

describe("tuition and residency", () => {
  it("charges public non-residents out-of-state tuition", () => {
    expect(tuitionFor(berkeley, "nonresident")).toBe(berkeley.costs.tuitionOutOfState.value);
    expect(tuitionFor(berkeley, "resident")).toBe(berkeley.costs.tuitionInState.value);
    expect(tuitionFor(berkeley, "nonresident")).toBeGreaterThan(tuitionFor(berkeley, "resident"));
  });
  it("charges private colleges the same regardless of residency", () => {
    expect(tuitionFor(nyu, "nonresident")).toBe(tuitionFor(nyu, "resident"));
  });
  it("residency materially changes total cost for public colleges", () => {
    const res = sumLines(annualCostLines(berkeley, "resident", "campus", sf));
    const non = sumLines(annualCostLines(berkeley, "nonresident", "campus", sf));
    expect(non - res).toBe((berkeley.costs.tuitionOutOfState.value ?? 0) - (berkeley.costs.tuitionInState.value ?? 0));
  });
});

describe("living arrangement", () => {
  const line = (living: "campus" | "off-campus" | "home", key: string) =>
    annualCostLines(berkeley, "resident", living, sf).find((l) => l.key === key)!.perYear;
  it("campus uses the published room and board", () => {
    expect(line("campus", "housing")).toBe(berkeley.costs.room.value);
    expect(line("campus", "food")).toBe(berkeley.costs.board.value);
  });
  it("living at home removes rent, lowers food and raises transportation", () => {
    expect(line("home", "housing")).toBe(0);
    expect(line("home", "food")).toBeLessThan(line("campus", "food"));
    expect(line("home", "transportation")).toBeGreaterThan(line("campus", "transportation"));
  });
  it("off-campus rent follows the local market", () => {
    expect(line("off-campus", "housing")).toBe(Math.round(sf.rent1br.value! * 0.6 * 12));
  });
});

describe("net cost", () => {
  it("gross − aid − scholarships − family = net student cost", () => {
    const n = calculateNetCost(40000, 4, { aidPerYear: 10000, scholarshipsPerYear: 2000, familyPerYear: 8000, workPerYear: 3000, savings: 5000 });
    expect(n.gross).toBe(160000);
    expect(n.netPrice).toBe(160000 - 40000 - 8000);
    expect(n.netStudentCost).toBe(n.netPrice - 32000);
    expect(n.borrowing).toBe(n.netStudentCost - 12000 - 5000);
  });
  it("never lets grants exceed the cost of attendance", () => {
    const n = calculateNetCost(20000, 4, { aidPerYear: 30000, scholarshipsPerYear: 5000, familyPerYear: 0, workPerYear: 0, savings: 0 });
    expect(n.aid).toBe(80000);
    expect(n.scholarships).toBe(0);
    expect(n.netPrice).toBe(0);
    expect(n.borrowing).toBe(0);
    expect(n.surplus).toBe(60000);
  });
  it("treats negative inputs as zero", () => {
    const n = calculateNetCost(30000, 4, { aidPerYear: -5, scholarshipsPerYear: -5, familyPerYear: -5, workPerYear: -5, savings: -5 });
    expect(n.borrowing).toBe(120000);
  });
  it("gross cost scales with years enrolled", () => {
    const lines = annualCostLines(berkeley, "resident", "campus", sf);
    expect(calculateGrossCost(lines, 5)).toBe(sumLines(lines) * 5);
  });
});
