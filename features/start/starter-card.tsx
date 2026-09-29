"use client";

import { Loader2 } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Segmented } from "@/components/ui/segmented";
import { goTo } from "@/lib/scroll";
import { useScenario } from "@/features/scenario/store";
import type { PathSel } from "@/features/scenario/types";

/**
 * STARTER CARD. The four choices that define a path, then one button.
 * Nothing is recalculated until "See my college path", so the form stays calm.
 */
export function StarterCard() {
  const { paths, setPath, personal, setPersonal, setActive, colleges, majors, loading } = useScenario();
  const [draft, setDraft] = useState<PathSel>(paths[0]);
  const [error, setError] = useState<string | null>(null);
  // Path 01 can also change elsewhere (cost slider, compare, "See an example"): follow it.
  const [synced, setSynced] = useState<PathSel>(paths[0]);
  if (synced !== paths[0]) {
    setSynced(paths[0]);
    setDraft(paths[0]);
  }
  const dirty = draft.collegeId !== paths[0].collegeId || draft.majorId !== paths[0].majorId || draft.residency !== paths[0].residency || draft.aid !== paths[0].aid;
  const aidId = useId();
  const college = colleges.find((c) => c.id === draft.collegeId)!;
  const collegeOpts = useMemo(() => colleges.map((c) => ({ value: c.id, label: c.shortName, meta: c.state, keywords: [c.name] })), [colleges]);
  const majorOpts = college.majorIds.map((id) => ({ value: id, label: majors.find((m) => m.id === id)?.name ?? id })).sort((a, b) => a.label.localeCompare(b.label));

  const pickCollege = (id: string) => {
    const c = colleges.find((x) => x.id === id)!;
    setError(null);
    setDraft((d) => ({ ...d, collegeId: id, majorId: c.majorIds.includes(d.majorId) ? d.majorId : c.majorIds[0] }));
  };

  // Not a <form>: Radix radio groups inside forms dispatch synthetic clicks
  // from effects, which collide with open popovers. Enter submits instead.
  const submit = async () => {
    setError(null);
    const ok = await setPath(0, draft);
    if (!ok) {
      setError("We couldn't load data for that college and major. Try a different major.");
      return;
    }
    setPersonal(true);
    setActive(0);
    goTo("your-path", "h2");
  };

  return (
    <div id="starter" role="form" className="grid scroll-mt-[calc(var(--nav-h)+16px)] gap-5 rounded-lg border border-accent/40 bg-surface p-5 shadow-3 sm:p-6" aria-labelledby="starter-h">
      <div className="grid gap-1">
        <h2 id="starter-h" className="text-h3 font-bold text-ink">
          Build your college path
        </h2>
        <p className="text-small text-ink-2">Four quick choices. You can change any of them later.</p>
      </div>
      <Combobox label="College" value={draft.collegeId} onChange={pickCollege} options={collegeOpts} searchPlaceholder="Search colleges" />
      <Combobox label="Major" value={draft.majorId} onChange={(v) => setDraft((d) => ({ ...d, majorId: v }))} options={majorOpts} searchPlaceholder="Search majors" />
      {college.control === "public" ? (
        <Segmented
          label="Residency"
          value={draft.residency}
          onChange={(v) => setDraft((d) => ({ ...d, residency: v }))}
          options={[
            { value: "resident", label: `In-state (${college.state})` },
            { value: "nonresident", label: "Out-of-state" },
          ]}
        />
      ) : (
        <div className="grid gap-1.5">
          <p className="text-caption font-medium text-muted">Residency</p>
          <p className="flex h-11 items-center rounded-sm border border-rule px-3 text-small text-ink-2">Private college: same tuition for everyone</p>
        </div>
      )}
      <div className="grid gap-1.5">
        <label htmlFor={aidId} className="text-caption font-medium text-muted">
          Grants &amp; scholarships per year <span className="font-normal">(optional)</span>
        </label>
        <div className="flex h-11 items-center gap-1 rounded-sm border border-rule-strong bg-surface px-3 shadow-1 focus-within:border-trace-a focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-2 focus-within:ring-offset-surface">
          <span className="text-muted" aria-hidden>
            $
          </span>
          <input
            id={aidId}
            inputMode="numeric"
            value={draft.aid === 0 ? "" : draft.aid.toLocaleString("en-US")}
            placeholder="0"
            onChange={(e) => {
              const n = Number(e.target.value.replace(/[^0-9]/g, ""));
              setDraft((d) => ({ ...d, aid: Math.min(100000, Number.isFinite(n) ? n : 0) }));
            }}
            onKeyDown={(e) => e.key === "Enter" && void submit()}
            className="tabular h-full w-full min-w-0 bg-transparent text-[0.9375rem] font-medium text-ink outline-none placeholder:text-muted"
            aria-describedby={`${aidId}-h`}
          />
        </div>
        <p id={`${aidId}-h`} className="text-caption text-muted">
          Money you don&apos;t pay back. Loans aren&apos;t aid.
        </p>
      </div>
      <Button size="lg" className="w-full" onClick={() => void submit()} disabled={loading === 0}>
        {loading === 0 ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
        {personal && dirty ? "Update my path" : "See my college path"}
      </Button>
      <p className={error ? "-mt-2 min-h-5 text-caption text-risk" : "-mt-2 min-h-5 text-caption text-muted"} role="status">
        {error ?? (personal && dirty ? "You've made changes. Update to see new numbers." : "")}
      </p>
    </div>
  );
}
