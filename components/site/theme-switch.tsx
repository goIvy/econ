"use client";

import { useEffect, useState } from "react";
import { Segmented } from "@/components/ui/segmented";

type Choice = "system" | "light" | "dark";

/** System / Light / Dark. "System" follows the device; the others persist in this browser. */
export function ThemeSwitch() {
  const [choice, setChoice] = useState<Choice>("system");
  useEffect(() => {
    try {
      const t = localStorage.getItem("cvl-theme");
      // Reading a browser-only value after mount is the documented way to avoid a hydration mismatch.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (t === "light" || t === "dark") setChoice(t);
    } catch {}
  }, []);
  const pick = (c: Choice) => {
    setChoice(c);
    try {
      if (c === "system") {
        localStorage.removeItem("cvl-theme");
        delete document.documentElement.dataset.theme;
      } else {
        localStorage.setItem("cvl-theme", c);
        document.documentElement.dataset.theme = c;
      }
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
        { value: "system", label: "System" },
        { value: "light", label: "Light" },
        { value: "dark", label: "Dark" },
      ]}
    />
  );
}
