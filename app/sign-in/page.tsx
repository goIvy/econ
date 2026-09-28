import type { Metadata } from "next";
import { InProgress } from "@/components/site/in-progress";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

/** Accounts ship in a later release. No sign-in form is shown until authentication is real. */
export default function SignInPage() {
  return (
    <InProgress
      title="Accounts are coming soon"
      lede="Soon you'll be able to save colleges, comparisons and paths, and share them with family or a counselor. Everything works without an account today."
      coming={[
        "Saved colleges, majors, comparisons and scenarios",
        "Folders such as Dream schools or California schools",
        "Shareable links with the assumptions, charts and sources included",
      ]}
      meanwhile={[
        { href: "/compare", label: "Compare paths", note: "Comparisons already have a shareable link. Copy it from the compare page." },
        { href: "/simulator", label: "Cost and debt simulator", note: "Model the full cost and loan payments for any path." },
      ]}
    />
  );
}
