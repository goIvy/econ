import { Nav } from "./nav";
import { Footer } from "./footer";
import { cn } from "@/lib/cn";

/** App page frame: nav, a page header on the measured field, content, footer. */
export function PageShell({
  title,
  lede,
  children,
  actions,
  headerExtra,
  wide,
}: {
  title: string;
  lede?: React.ReactNode;
  children: React.ReactNode;
  actions?: React.ReactNode;
  headerExtra?: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <>
      <Nav />
      <main id="main" className="min-h-[70dvh]">
        <header className="relative isolate overflow-hidden border-b border-rule">
          <div aria-hidden className="measured-field field-fade pointer-events-none absolute inset-0 -z-10" />
          <div className={cn("mx-auto grid gap-4 px-4 pb-10 pt-10 md:px-8 md:pb-12 md:pt-14 xl:px-12", wide ? "max-w-[1320px]" : "max-w-[1200px]")}>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div className="grid max-w-[46rem] gap-3">
                <h1 className="text-h1 font-bold">{title}</h1>
                {lede && <div className="text-lede text-ink-2">{lede}</div>}
              </div>
              {actions}
            </div>
            {headerExtra}
          </div>
        </header>
        <div className={cn("mx-auto px-4 py-10 md:px-8 md:py-12 xl:px-12", wide ? "max-w-[1320px]" : "max-w-[1200px]")}>{children}</div>
      </main>
      <Footer />
    </>
  );
}
