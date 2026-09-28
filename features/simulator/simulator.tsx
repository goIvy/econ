"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { TraceChart } from "@/components/charts/trace-chart";
import { Combobox, type ComboOption } from "@/components/ui/combobox";
import { Readout } from "@/components/ui/readout";
import { MethodologyDialog } from "@/components/ui/methodology-dialog";
import { CostControls, CostLedger } from "@/features/cost/cost-model";
import { DebtModel } from "@/features/debt/debt-model";
import { usePath } from "@/hooks/use-path";
import { crossfade, enter } from "@/lib/animations";
import { money } from "@/lib/format";
import type { FundingInputs, LivingArrangement, Residency } from "@/types";
import type { CollegeMeta } from "@/features/comparison/compare-workspace";

interface Tuition { in: number; out: number }

export function Simulator({ colleges, majors, tuition }: { colleges: CollegeMeta[]; majors: Array<{ id: string; name: string; category: string }>; tuition: Record<string, Tuition> }) {
  const [collegeId, setCollegeId] = useState("uc-berkeley");
  const [majorId, setMajorId] = useState("economics");
  const [residency, setResidency] = useState<Residency>("resident");
  const [living, setLiving] = useState<LivingArrangement>("campus");
  const [funding, setFunding] = useState<FundingInputs>({ aidPerYear: 15000, scholarshipsPerYear: 0, familyPerYear: 10000, workPerYear: 3000, savings: 0 });
  const path = usePath();
  const college = colleges.find((c) => c.id === collegeId)!;

  // Recalculate as inputs change, debounced so dragging a slider stays smooth.
  useEffect(() => {
    if (!college.majorIds.includes(majorId)) return;
    const t = setTimeout(() => {
      path.run({ collegeId, majorId, residency: college.control === "private" ? "resident" : residency, living, funding, horizonAge: 40 });
    }, 180);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collegeId, majorId, residency, living, funding]);

  const collegeOpts: ComboOption[] = useMemo(() => colleges.map((c) => ({ value: c.id, label: c.shortName, meta: `${c.city}, ${c.state} · ${c.control === "public" ? "Public" : "Private"}`, keywords: [c.name] })), [colleges]);
  const majorOpts: ComboOption[] = useMemo(
    () => majors.map((m) => ({ value: m.id, label: m.name, group: m.category, disabled: !college.majorIds.includes(m.id), meta: college.majorIds.includes(m.id) ? undefined : `Not offered at ${college.shortName}` })),
    [majors, college],
  );
  const d = path.data;
  const offered = college.majorIds.includes(majorId);

  return (
    <div className="grid gap-10">
      <div className="grid gap-4 rounded-lg border border-rule bg-surface p-4 shadow-2 sm:grid-cols-2 sm:p-6 lg:grid-cols-[1fr_1fr_auto]">
        <Combobox
          label="College"
          value={collegeId}
          onChange={(v) => {
            setCollegeId(v);
            const c = colleges.find((x) => x.id === v)!;
            setFunding((f) => ({ ...f, aidPerYear: Math.round(c.avgGrant / 500) * 500 }));
            if (!c.majorIds.includes(majorId)) setMajorId(c.majorIds.includes("economics") ? "economics" : c.majorIds[0]);
          }}
          options={collegeOpts}
          searchPlaceholder="Search by name, city or state"
        />
        <Combobox label="Major" value={majorId} onChange={setMajorId} options={majorOpts} searchPlaceholder="Search majors" />
        <div className="flex items-end">
          <MethodologyDialog ids={["total-cost", "net-cost", "loans", "break-even"]} />
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-12">
        <section aria-labelledby="inputs-h" className="lg:col-span-4">
          <h2 id="inputs-h" className="mb-5 text-h3 font-semibold">Your assumptions</h2>
          <CostControls
            control={college.control}
            state={college.state}
            residency={residency}
            onResidency={setResidency}
            living={living}
            onLiving={setLiving}
            funding={funding}
            onFunding={setFunding}
            tuitionIn={tuition[collegeId].in}
            tuitionOut={tuition[collegeId].out}
          />
        </section>

        <section aria-labelledby="cost-h" className="grid content-start gap-8 lg:col-span-8">
          <h2 id="cost-h" className="sr-only">Cost calculator results</h2>
          <AnimatePresence mode="wait">
            {!offered ? (
              <motion.p key="no" variants={crossfade} initial="hidden" animate="visible" exit="exit" className="rounded-md border border-dashed border-rule-strong p-6 text-small text-ink-2">
                {college.shortName} doesn&apos;t offer this major in our data. Choose another major to continue.
              </motion.p>
            ) : path.status === "error" && !d ? (
              <motion.div key="err" variants={crossfade} initial="hidden" animate="visible" exit="exit" role="alert" className="flex items-start gap-2 rounded-md bg-risk-tint p-4 text-small text-risk">
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden /> {path.error}
              </motion.div>
            ) : !d ? (
              <motion.div key="sk" variants={crossfade} initial="hidden" animate="visible" exit="exit" className="grid gap-4" aria-busy="true">
                <div className="h-8 w-60 animate-pulse rounded bg-surface-sunk" />
                <div className="h-72 animate-pulse rounded-lg bg-surface-sunk" />
              </motion.div>
            ) : (
              <motion.div key="res" variants={crossfade} initial="hidden" animate="visible" className={path.status === "loading" ? "grid gap-8 opacity-70 transition-opacity" : "grid gap-8 transition-opacity"}>
                <dl className="grid grid-cols-2 gap-5 sm:grid-cols-4">
                  <Readout label="Net cost, 4 years" value={d.net.netPrice} format={money} lineage={d.lineage.netCost} footnote={1} />
                  <Readout label="Estimated debt" value={d.net.borrowing} format={money} lineage={d.lineage.model} footnote={2} />
                  <Readout label="Monthly payment" value={d.loan.monthlyPayment} format={money} lineage={d.lineage.loanRate} footnote={3} unit="/mo" />
                  <Readout label="Break-even age" value={d.breakEven?.age ?? null} format={(n) => n.toFixed(1)} lineage={d.lineage.model} footnote={4} estimate emptyText="Not by 40" />
                </dl>
                <div className="rounded-lg border border-rule bg-surface p-4 shadow-2 sm:p-6">
                  <CostLedger lines={d.costLines} net={d.net} lineage={d.lineage.netCost} title={`${d.college.shortName}, one year`} />
                </div>
                <div className="rounded-lg border border-rule bg-surface p-4 shadow-2 sm:p-6">
                  <TraceChart
                    title="Cumulative net value"
                    series={[
                      { id: "p", trace: "a", label: `${d.college.shortName} ${d.major.name}`, points: d.series.map((p) => ({ x: p.age, y: p.cumulative })) },
                      { id: "b", trace: "baseline", label: "Working from 18, no degree", points: d.baseline.map((p) => ({ x: p.age, y: p.cumulative })) },
                    ]}
                    marker={d.breakEven ? { x: d.breakEven.age, y: interp(d.series, d.breakEven.age), label: `Break-even ≈ age ${d.breakEven.age.toFixed(1)}` } : null}
                    band={{ from: 18, to: d.graduationAge, label: "College" }}
                    summary={d.breakEven ? `Based on these assumptions, this path passes working from 18 without a degree around age ${d.breakEven.age.toFixed(1)}.` : "With these assumptions, this path doesn't pass the no-degree path by age 40."}
                    height={300}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>

      <AnimatePresence>
      {d && offered && (
        <motion.section key="debt" variants={enter} initial="hidden" animate="visible" exit="exit" aria-labelledby="debt-h" className="grid gap-6 border-t border-rule pt-10">
          <div className="grid max-w-[44rem] gap-2">
            <h2 id="debt-h" className="text-h2 font-bold">Debt calculator</h2>
            <p className="text-lede text-ink-2">Starts from the borrowing estimated above. Change the rate, loan type or term to see how payments and interest move.</p>
          </div>
          <DebtModel key={Math.round(d.net.borrowing)} defaultPrincipal={d.net.borrowing} />
        </motion.section>
      )}
      </AnimatePresence>
    </div>
  );
}

function interp(rows: Array<{ age: number; cumulative: number }>, age: number) {
  const i = Math.max(0, rows.findIndex((p) => p.age > age) - 1);
  const a = rows[i], b = rows[i + 1] ?? a;
  return a.cumulative + (b.age === a.age ? 0 : ((age - a.age) / (b.age - a.age)) * (b.cumulative - a.cumulative));
}
