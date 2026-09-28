"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main id="main" className="mx-auto grid min-h-[70dvh] max-w-[40rem] content-center gap-5 px-4 py-20">
      <AlertCircle className="size-8 text-risk" aria-hidden />
      <h1 className="text-h1 font-[720]">Something went wrong on our side</h1>
      <p className="text-lede text-ink-2">This page couldn&apos;t load. Your inputs weren&apos;t lost; try again, or head back to the homepage.</p>
      {error.digest && <p className="text-caption text-muted">Reference: {error.digest}</p>}
      <div className="flex flex-wrap gap-3">
        <Button onClick={reset}>Try again</Button>
        <ButtonLink href="/" variant="secondary">
          Go to the homepage
        </ButtonLink>
      </div>
    </main>
  );
}
