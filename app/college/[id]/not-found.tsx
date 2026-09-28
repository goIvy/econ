import { PageShell } from "@/components/site/page-shell";
import { ButtonLink } from "@/components/ui/button";

export default function CollegeNotFound() {
  return (
    <PageShell title="We don't have that college yet" lede="The demo dataset covers 120 colleges. Search for another, or browse by state.">
      <ButtonLink href="/explore">Search colleges</ButtonLink>
    </PageShell>
  );
}
