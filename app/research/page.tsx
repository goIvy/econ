import type { Metadata } from "next";
import { InProgress } from "@/components/site/in-progress";

export const metadata: Metadata = { title: "Research lab", description: "Research questions on ROI by major, geography, net price and earnings distributions. In progress." };

export default function ResearchPage() {
  return (
    <InProgress
      title="Research lab"
      lede="Questions about college value, answered with charts you can inspect, and labeled clearly where correlation isn't causation."
      coming={[
        "How does ROI vary by major?",
        "How does geographic cost of living change college value?",
        "How does net price affect break-even time?",
        "How different are earnings distributions across majors?",
        "Scatter plots of net price, debt, graduation rate and earnings",
      ]}
      meanwhile={[
        { href: "/methodology", label: "Methodology", note: "Every formula, its limits, and how data confidence is scored." },
        { href: "/compare", label: "Compare paths", note: "Put up to five college paths side by side." },
      ]}
    />
  );
}
