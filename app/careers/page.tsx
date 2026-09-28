import type { Metadata } from "next";
import { InProgress } from "@/components/site/in-progress";

export const metadata: Metadata = { title: "Careers", description: "Career explorer: salaries, growth, education requirements and where jobs are concentrated. In progress." };

export default function CareersPage() {
  return (
    <InProgress
      title="Career explorer"
      lede="Salaries, growth, education requirements and where jobs are concentrated, for the careers each major leads to."
      coming={[
        "Career categories by major, such as finance, consulting, analytics and government",
        "Salary and 10-year growth for each category",
        "Typical education requirements and graduate-school tradeoffs",
        "Geographic concentration of jobs, adjusted for cost of living",
      ]}
      meanwhile={[
        { href: "/majors", label: "Majors", note: "Typical occupations, wages, growth and industries for 50 majors." },
        { href: "/explore", label: "College search", note: "Program-level earnings and employment on every college page." },
      ]}
    />
  );
}
