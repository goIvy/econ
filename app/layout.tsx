import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import localFont from "next/font/local";
import { Providers } from "@/components/providers";
import "./globals.css";

/** Editorial display serif for headlines (Instrument Serif, OFL, via @fontsource files). */
const serif = localFont({
  variable: "--font-instrument-serif",
  display: "swap",
  src: [
    { path: "../node_modules/@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../node_modules/@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2", weight: "400", style: "italic" },
  ],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://collegevaluelab.com"),
  title: {
    default: "College Value Lab: see what college is really worth",
    template: "%s | College Value Lab",
  },
  description:
    "Explore the true economics of college, from tuition and debt to employment, salary, and long-term financial outcomes.",
  openGraph: {
    title: "College Value Lab",
    description:
      "Compare the real financial value of a specific college and major: net cost, debt, earnings, and break-even, with every number sourced.",
    type: "website",
    siteName: "College Value Lab",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0c",
  colorScheme: "dark light",
};

/** Dark is the default. Applies a saved Light or System choice before first paint (no flash). */
const THEME_SCRIPT = `try{var t=localStorage.getItem("cvl-theme");if(t==="light")document.documentElement.dataset.theme="light";else if(t==="system")delete document.documentElement.dataset.theme}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-theme="dark" className={`${GeistSans.variable} ${GeistMono.variable} ${serif.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-dvh overflow-x-clip bg-paper text-ink">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
