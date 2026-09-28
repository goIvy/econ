import { Nav } from "@/components/site/nav";

export default function Loading() {
  return (
    <>
      <Nav />
      <main id="main" className="mx-auto max-w-[1200px] px-4 py-14 md:px-8 xl:px-12" aria-busy="true" aria-label="Loading colleges">
        <div className="h-10 w-72 animate-pulse rounded bg-surface-sunk" />
        <div className="mt-6 h-14 animate-pulse rounded-md bg-surface-sunk" />
        <div className="mt-10 grid gap-8 lg:grid-cols-[17rem_1fr] lg:gap-12">
          <div className="hidden gap-4 lg:grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded bg-surface-sunk" />
            ))}
          </div>
          <div className="grid gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-md bg-surface-sunk" />
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
