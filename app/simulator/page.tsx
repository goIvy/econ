import type { Metadata } from "next";
import { PageShell } from "@/components/site/page-shell";
import { SampleChip } from "@/components/ui/lineage";
import { Simulator } from "@/features/simulator/simulator";
import type { CollegeMeta } from "@/features/comparison/compare-workspace";
import { listColleges, majorOptions } from "@/services/data";

export const metadata: Metadata = {
  title: "Cost and debt simulator",
  description: "Model the full cost of a college path: tuition, housing, food and more, minus aid, then the loans, monthly payments and break-even that follow.",
};

export default function SimulatorPage() {
  const all = listColleges();
  const colleges: CollegeMeta[] = all
    .map((c) => ({ id: c.id, name: c.name, shortName: c.shortName, city: c.city, state: c.state, control: c.control, avgGrant: c.aid.avgGrant.value ?? 0, majorIds: c.majorIds }))
    .sort((a, b) => a.shortName.localeCompare(b.shortName));
  const tuition = Object.fromEntries(all.map((c) => [c.id, { in: (c.costs.tuitionInState.value ?? 0) + (c.costs.fees.value ?? 0), out: (c.costs.tuitionOutOfState.value ?? 0) + (c.costs.fees.value ?? 0) }]));
  return (
    <PageShell
      title="Cost and debt simulator"
      lede="Every line of a college's cost, what aid and your family cover, what's left to borrow, and what that loan costs over time."
      actions={<SampleChip />}
    >
      <Simulator colleges={colleges} majors={majorOptions().map((m) => ({ id: m.id, name: m.name, category: m.category }))} tuition={tuition} />
    </PageShell>
  );
}
