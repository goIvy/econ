import { PageShell } from "@/components/site/page-shell";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <PageShell title="This page isn't here" lede="The link may be old, or the page may have moved.">
      <div className="flex flex-wrap gap-3">
        <ButtonLink href="/">Go to the homepage</ButtonLink>
        <ButtonLink href="/explore" variant="secondary">
          Search colleges
        </ButtonLink>
      </div>
    </PageShell>
  );
}
