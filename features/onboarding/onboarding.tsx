"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Combobox, MultiCombobox, type ComboOption } from "@/components/ui/combobox";
import { easeOutExpo, microSpring } from "@/lib/animations";
import { money } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { CollegeMeta } from "@/features/comparison/compare-workspace";

const GOALS = ["Colleges", "Majors", "Career paths", "Financial outcomes", "All of the above"] as const;
const GRADES = ["Freshman", "Sophomore", "Junior", "Senior", "College student", "Parent", "Counselor"] as const;
const STORE = "cvl:onboarding";

interface Answers {
  goals: string[];
  grade: string | null;
  colleges: string[];
  majors: string[];
  state: string | null;
  cityId: string | null;
  money: { scholarship: string; aid: string; family: string; loan: string; work: string; savings: string; home: boolean };
}

const EMPTY: Answers = { goals: [], grade: null, colleges: [], majors: [], state: null, cityId: null, money: { scholarship: "", aid: "", family: "", loan: "", work: "", savings: "", home: false } };

const STEPS = [
  { title: "What are you trying to compare?", hint: "Pick any that apply." },
  { title: "What grade are you in?", hint: "This helps us word things for you." },
  { title: "What colleges are you considering?", hint: "Search and pick up to five." },
  { title: "What majors are you considering?", hint: "Pick as many as you like. We'll pair them with your colleges." },
  { title: "Where do you live?", hint: "Used for residency, tuition and geographic comparison." },
  { title: "What financial assumptions would you like to add?", hint: "All optional. Yearly amounts unless noted." },
];

export function Onboarding({ colleges, majors, states, cities }: { colleges: CollegeMeta[]; majors: Array<{ id: string; name: string; category: string }>; states: Array<{ value: string; label: string }>; cities: Array<{ value: string; label: string }> }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [a, setA] = useState<Answers>(EMPTY);
  const [done, setDone] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORE);
      if (saved) setA({ ...EMPTY, ...JSON.parse(saved) });
    } catch {
      /* storage unavailable: start fresh */
    }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(STORE, JSON.stringify(a));
    } catch {
      /* ignore */
    }
  }, [a]);

  const go = (to: number) => {
    setDir(to > step ? 1 : -1);
    if (to >= STEPS.length) setDone(true);
    else setStep(Math.max(0, to));
  };

  const collegeOpts: ComboOption[] = useMemo(() => colleges.map((c) => ({ value: c.id, label: c.shortName, meta: `${c.city}, ${c.state}`, keywords: [c.name] })), [colleges]);
  const majorOpts: ComboOption[] = useMemo(() => majors.map((m) => ({ value: m.id, label: m.name, meta: m.category })), [majors]);

  const compareHref = useMemo(() => {
    const aid = (Number(a.money.aid) || 0) + (Number(a.money.scholarship) || 0);
    const living = a.money.home ? "h" : "c";
    const picks = a.colleges.slice(0, 5).map((id, i) => {
      const c = colleges.find((x) => x.id === id)!;
      const wanted = a.majors.length ? a.majors[i % a.majors.length] : "economics";
      const major = c.majorIds.includes(wanted) ? wanted : a.majors.find((m) => c.majorIds.includes(m)) ?? (c.majorIds.includes("economics") ? "economics" : c.majorIds[0]);
      const res = a.state && c.control === "public" && c.state !== a.state ? "n" : "r";
      const yearlyAid = aid || Math.round(c.avgGrant / 500) * 500;
      return `${id}.${major}.${res}.${living}.${yearlyAid}`;
    });
    const f = [a.money.family, a.money.work, a.money.savings, a.money.loan].map((v) => Number(v) || 0);
    const fParam = f.some((v) => v > 0) ? `&f=${f.join(".")}` : "";
    return picks.length ? `/compare?p=${picks.join(",")}${fParam}` : "/explore";
  }, [a, colleges]);

  const variants = {
    enter: (d: number) => (reduce ? { opacity: 0 } : { opacity: 0, x: d * 32, filter: "blur(4px)" }),
    center: { opacity: 1, x: 0, filter: "blur(0px)", transition: { type: "spring" as const, duration: 0.45, bounce: 0 } },
    exit: (d: number) => (reduce ? { opacity: 0 } : { opacity: 0, x: d * -24, filter: "blur(2px)", transition: { duration: 0.18 } }),
  };

  if (done) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", duration: 0.45, bounce: 0 }} className="mx-auto grid max-w-[40rem] gap-6 rounded-lg border border-rule bg-surface p-6 shadow-3 sm:p-8">
        <span className="grid size-10 place-items-center rounded-full bg-gain-tint text-gain">
          <Check className="size-5" aria-hidden />
        </span>
        <h2 className="text-h2 font-bold">You&apos;re set up</h2>
        <dl className="grid gap-3 text-small">
          <Summary label="Comparing" value={a.goals.join(", ") || "Skipped"} />
          <Summary label="You are" value={a.grade ?? "Skipped"} />
          <Summary label="Colleges" value={a.colleges.map((id) => colleges.find((c) => c.id === id)?.shortName).join(", ") || "Skipped"} />
          <Summary label="Majors" value={a.majors.map((id) => majors.find((m) => m.id === id)?.name).join(", ") || "Skipped"} />
          <Summary label="Home state" value={states.find((s) => s.value === a.state)?.label ?? "Skipped"} />
          <Summary label="Aid" value={a.money.aid || a.money.scholarship ? `${money((Number(a.money.aid) || 0) + (Number(a.money.scholarship) || 0))}/yr` : "Using each college's average grant"} />
        </dl>
        <div className="flex flex-wrap gap-3">
          <Button size="lg" onClick={() => router.push(compareHref)}>
            {a.colleges.length ? "See my comparison" : "Find colleges to compare"}
          </Button>
          <Button size="lg" variant="quiet" onClick={() => { setDone(false); setStep(0); }}>
            Change answers
          </Button>
        </div>
        <p className="text-caption text-muted">Your answers stay in this browser. Accounts and saved comparisons are coming in a later release.</p>
      </motion.div>
    );
  }

  const s = STEPS[step];
  return (
    <div className="mx-auto grid max-w-[44rem] gap-8">
      {/* progress: a graduated scale */}
      <div className="grid gap-2" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
        <div className="flex items-center justify-between text-caption text-muted">
          <span>Step {step + 1} of {STEPS.length}</span>
          <button type="button" onClick={() => go(STEPS.length)} className="font-semibold text-ink-2 underline decoration-rule-strong underline-offset-4 hover:text-ink">
            Skip the rest
          </button>
        </div>
        <div className="relative flex h-2 gap-1">
          {STEPS.map((_, i) => (
            <span key={i} className="relative flex-1 overflow-hidden rounded-full bg-surface-sunk">
              <motion.span className="absolute inset-y-0 left-0 rounded-full bg-ink" initial={false} animate={{ width: i < step ? "100%" : i === step ? "50%" : "0%" }} transition={{ duration: 0.4, ease: easeOutExpo }} />
            </span>
          ))}
        </div>
      </div>

      <div className="relative min-h-[26rem]">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.section key={step} custom={dir} variants={variants} initial="enter" animate="center" exit="exit" aria-labelledby={`step-${step}`} className="grid gap-6">
            <div className="grid gap-2">
              <h2 id={`step-${step}`} className="text-h2 font-bold">{s.title}</h2>
              <p className="text-lede text-ink-2">{s.hint}</p>
            </div>

            {step === 0 && (
              <ChoiceGrid multiple options={[...GOALS]} value={a.goals} onChange={(goals) => setA({ ...a, goals: goals.includes("All of the above") && !a.goals.includes("All of the above") ? ["All of the above"] : goals.filter((g) => g !== "All of the above" || goals.length === 1) })} />
            )}
            {step === 1 && <ChoiceGrid options={[...GRADES]} value={a.grade ? [a.grade] : []} onChange={(v) => setA({ ...a, grade: v[0] ?? null })} />}
            {step === 2 && <MultiCombobox label="Colleges" values={a.colleges} onChange={(colleges) => setA({ ...a, colleges })} options={collegeOpts} max={5} placeholder="Search by college name, city or state" emptyText="No colleges match. The demo covers 120 colleges." />}
            {step === 3 && <MultiCombobox label="Majors" values={a.majors} onChange={(ms) => setA({ ...a, majors: ms })} options={majorOpts} placeholder="Search majors, like Economics or Nursing" />}
            {step === 4 && (
              <div className="grid gap-5 sm:grid-cols-2">
                <Combobox label="Home state" value={a.state} onChange={(v) => setA({ ...a, state: v })} options={states} placeholder="Choose your state" searchPlaceholder="Search states" />
                <Combobox label="Nearest metro area (optional)" value={a.cityId} onChange={(v) => setA({ ...a, cityId: v })} options={cities} placeholder="Choose a metro" searchPlaceholder="Search metros" />
                <p className="text-caption text-muted sm:col-span-2">Public colleges in your home state usually charge you in-state tuition. We use this to set residency for each college.</p>
              </div>
            )}
            {step === 5 && (
              <div className="grid gap-4 sm:grid-cols-2">
                <MoneyField label="Scholarships" value={a.money.scholarship} onChange={(v) => setA({ ...a, money: { ...a.money, scholarship: v } })} suffix="/yr" />
                <MoneyField label="Financial aid (grants)" value={a.money.aid} onChange={(v) => setA({ ...a, money: { ...a.money, aid: v } })} suffix="/yr" />
                <MoneyField label="Family contribution" value={a.money.family} onChange={(v) => setA({ ...a, money: { ...a.money, family: v } })} suffix="/yr" />
                <MoneyField label="Loan amount" value={a.money.loan} onChange={(v) => setA({ ...a, money: { ...a.money, loan: v } })} suffix="total" />
                <MoneyField label="Work-study" value={a.money.work} onChange={(v) => setA({ ...a, money: { ...a.money, work: v } })} suffix="/yr" />
                <MoneyField label="Savings" value={a.money.savings} onChange={(v) => setA({ ...a, money: { ...a.money, savings: v } })} suffix="total" />
                <label className="flex cursor-pointer items-center gap-3 rounded-md border border-rule-strong bg-surface p-4 sm:col-span-2">
                  <input type="checkbox" checked={a.money.home} onChange={(e) => setA({ ...a, money: { ...a.money, home: e.target.checked } })} className="size-5 accent-[var(--ink)]" />
                  <span className="grid">
                    <span className="text-small font-semibold text-ink">I plan to live at home</span>
                    <span className="text-caption text-muted">Removes rent and lowers food costs; adds commuting.</span>
                  </span>
                </label>
              </div>
            )}
          </motion.section>
        </AnimatePresence>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-6">
        <Button variant="quiet" onClick={() => go(step - 1)} disabled={step === 0}>
          <ArrowLeft className="size-4" aria-hidden /> Back
        </Button>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => go(step + 1)}>
            Skip
          </Button>
          <Button onClick={() => go(step + 1)}>{step === STEPS.length - 1 ? "Finish" : "Continue"}</Button>
        </div>
      </div>
    </div>
  );
}

function ChoiceGrid({ options, value, onChange, multiple }: { options: string[]; value: string[]; onChange: (v: string[]) => void; multiple?: boolean }) {
  return (
    <div role={multiple ? "group" : "radiogroup"} className="grid gap-2 sm:grid-cols-2">
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <motion.button
            key={o}
            type="button"
            role={multiple ? "checkbox" : "radio"}
            aria-checked={on}
            whileTap={{ scale: 0.98 }}
            transition={microSpring}
            onClick={() => onChange(multiple ? (on ? value.filter((v) => v !== o) : [...value, o]) : on ? [] : [o])}
            className={cn("flex min-h-14 items-center justify-between gap-3 rounded-md border px-4 text-left text-base font-medium transition-colors", on ? "border-ink bg-ink text-white" : "border-rule-strong bg-surface text-ink hover:border-ink")}
          >
            {o}
            <span className={cn("grid size-5 shrink-0 place-items-center border", multiple ? "rounded-[5px]" : "rounded-full", on ? "border-white bg-white text-ink" : "border-rule-strong")} aria-hidden>
              {on && <Check className="size-3.5" strokeWidth={3} />}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

function MoneyField({ label, value, onChange, suffix }: { label: string; value: string; onChange: (v: string) => void; suffix: string }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-caption font-medium text-muted">{label}</span>
      <span className="flex h-12 items-center rounded-sm border border-rule-strong bg-surface px-3 shadow-1 focus-within:border-trace-a">
        <span className="text-muted" aria-hidden>$</span>
        <input
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, "").slice(0, 7))}
          placeholder="0"
          className="tabular h-full min-w-0 flex-1 bg-transparent px-1 text-base text-ink outline-none placeholder:text-muted"
          aria-label={`${label} in dollars ${suffix === "/yr" ? "per year" : "total"}`}
        />
        <span className="text-caption text-muted">{suffix}</span>
      </span>
    </label>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-3 border-b border-rule pb-2">
      <dt className="text-muted">{label}</dt>
      <dd className="text-ink">{value}</dd>
    </div>
  );
}
