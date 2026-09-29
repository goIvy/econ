"use client";

import { useEffect, useState } from "react";
import { Segmented } from "@/components/ui/segmented";

type Choice = "system" | "light" | "dark";

/** Dark (default) / Light / System. Light and System persist in this browser; Dark stores nothing. */
export function ThemeSwitch() {
  const [choice, setChoice] = useState<Choice>("dark");
  useEffect(() => {
    try {
      const t = localStorage.getItem("cvl-theme");
      // Reading a browser-only value after mount is the documented way to avoid a hydration mismatch.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (t === "light" || t === "system") setChoice(t);
    } catch {}
  }, []);
  const pick = (c: Choice) => {
    setChoice(c);
    try {
      if (c === "dark") localStorage.removeItem("cvl-theme");
      else localStorage.setItem("cvl-theme", c);
      if (c === "system") delete document.documentElement.dataset.theme;
      else document.documentElement.dataset.theme = c;
    } catch {}
  };
  return (
    <Segmented
      label="Theme"
      size="sm"
      value={choice}
      onChange={pick}
      className="w-[15rem]"
      options={[
        { value: "dark", label: "Dark" },
        { value: "light", label: "Light" },
        { value: "system", label: "System" },
      ]}
    />
  );
}
