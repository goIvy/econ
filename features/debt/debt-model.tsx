"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { GraduatedSlider } from "@/components/ui/graduated-slider";
import { Readout } from "@/components/ui/readout";
import { Segmented } from "@/components/ui/segmented";
import { LineKey } from "@/components/ui/lineage";
import { DEFAULT_RATES, LOAN_TYPE_LABELS, summarizeLoan } from "@/lib/calc/loans";
import { lineage } from "@/data/sources";
import { money, moneyCents, moneyCompact } from "@/lib/format";
import type { LoanType } from "@/types";

const RATE_LINEAGE = lineage("fsa-rates", "2024–25", "Loans first disbursed July 1, 2024 – June 30, 2025");
const MODEL = lineage("cvl-model", 2024, "Standard amortization of your inputs");

/**
 * Student-loan model (spec §14): principal, rate, type, term → payment,
 * interest, repayment, payoff years, and an interactive balance curve.
 */
export function DebtModel({ defaultPrincipal, yearsInSchool = 4 }: { defaultPrincipal: number; yearsInSchool?: number }) {
  const [principal, setPrincipal] = useState(Math.round(defaultPrincipal / 500) * 500);
  const [type, setType] = useState<LoanType>("federal-unsubsidized");
  const [rate, setRate] = useState(DEFAULT_RATES["federal-unsubsidized"]);
  const [term, setTerm] = useState<"10" | "15" | "20" | "25">("10");

  const s = useMemo(() => summarizeLoan({ principal, ratePct: rate, type, termYears: Number(term) }, yearsInSchool), [principal, rate, type, term, yearsInSchool]);
  const data = s.schedule.map((p) => ({ year: p.year, balance: Math.round(p.balance) }));
  const halfway = s.schedule.find((p) => p.balance <= s.repaymentBalance / 2)?.year;

  const summary =
    principal > 0
      ? `Borrowing ${money(principal)} at ${rate.toFixed(2)}% over ${term} years costs ${moneyCents(s.monthlyPayment)} a month and ${money(s.totalInterest)} in interest, ${money(s.totalRepayment)} in total. Half the balance is paid off by year ${halfway ?? term}.`
      : "No borrowing, so there are no loan payments.";

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      <div className="grid content-start gap-6 lg:col-span-5">
        <GraduatedSlider label="Loan principal" value={principal} onChange={setPrincipal} min={0} max={150000} step={500} format={moneyCompact} />
        <label className="grid gap-1.5">
          <span className="text-caption font-medium text-muted">Loan type</span>
          <select
            value={type}
            onChange={(e) => {
              const t = e.target.value as LoanType;
              setType(t);
              setRate(DEFAULT_RATES[t]);
            }}
            className="h-11 rounded-sm border border-rule-strong bg-surface px-3 text-[0.9375rem] font-medium text-ink shadow-1"
          >
            {(Object.keys(LOAN_TYPE_LABELS) as LoanType[]).map((t) => (
              <option key={t} value={t}>
                {LOAN_TYPE_LABELS[t]} ({DEFAULT_RATES[t]}%{t === "private" ? ", assumption" : ""})
              </option>
            ))}
          </select>
          <span className="text-caption text-muted">{type === "federal-subsidized" ? "Interest doesn't build up while you're enrolled." : "Interest builds up while you're in school and is added to the balance at repayment."}</span>
        </label>
        <GraduatedSlider label="Interest rate" value={rate} onChange={setRate} min={0} max={15} step={0.05} format={(v) => `${v.toFixed(2)}%`} ticks={15} trace="b" />
        <Segmented
          label="Repayment term"
          value={term}
          onChange={setTerm}
          options={[
            { value: "10", label: "10 yrs" },
            { value: "15", label: "15 yrs" },
            { value: "20", label: "20 yrs" },
            { value: "25", label: "25 yrs" },
          ]}
        />
      </div>

      <div className="grid content-start gap-6 lg:col-span-7">
        <dl className="grid grid-cols-2 gap-5 sm:grid-cols-4">
          <Readout label="Monthly payment" value={s.monthlyPayment} format={moneyCents} lineage={MODEL} footnote={1} />
          <Readout label="Total interest" value={s.totalInterest} format={money} lineage={RATE_LINEAGE} footnote={2} />
          <Readout label="Total repayment" value={s.totalRepayment} format={money} lineage={MODEL} footnote={3} />
          <Readout label="Years to payoff" value={s.payoffYears} format={(n) => n.toFixed(0)} lineage={MODEL} footnote={4} />
        </dl>
        {s.inSchoolInterest > 0 && (
          <p className="text-caption text-muted">
            Includes {money(s.inSchoolInterest)} of interest that builds up during {yearsInSchool} years of school and a six-month grace period.
          </p>
        )}
        <figure className="grid gap-3">
          <figcaption className="flex items-center gap-2 text-caption text-ink-2">
            <LineKey trace="a" /> Remaining balance by year of repayment
          </figcaption>
          <div className="h-60 w-full" role="img" aria-label={summary}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: 0 }}>
                <defs>
                  <linearGradient id="debt-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--trace-a)" stopOpacity={0.16} />
                    <stop offset="100%" stopColor="var(--trace-a)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--rule)" />
                <XAxis dataKey="year" tickLine={false} axisLine={{ stroke: "var(--rule-strong)" }} tick={{ fill: "var(--muted)", fontSize: 11 }} label={{ value: "Years into repayment", position: "insideBottomRight", offset: -2, fill: "var(--muted)", fontSize: 11 }} height={36} />
                <YAxis tickFormatter={(v) => moneyCompact(v)} tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} width={56} />
                <Tooltip
                  cursor={{ stroke: "var(--ink)", strokeOpacity: 0.35 }}
                  content={({ active, payload, label }) =>
                    active && payload?.length ? (
                      <div className="rounded-sm border border-rule bg-surface px-3 py-2 shadow-2">
                        <p className="tabular text-small font-semibold text-ink">{money(payload[0].value as number)}</p>
                        <p className="text-caption text-muted">left after year {label}</p>
                      </div>
                    ) : null
                  }
                />
                <Area type="monotone" dataKey="balance" stroke="var(--trace-a)" strokeWidth={2} fill="url(#debt-fill)" isAnimationActive animationDuration={700} dot={false} activeDot={{ r: 5, stroke: "var(--surface)", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="text-small text-ink-2">{summary}</p>
        </figure>
      </div>
    </div>
  );
}
