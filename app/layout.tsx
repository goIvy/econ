import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Providers } from "@/components/providers";
import "./globals.css";

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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f4f5" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0f12" },
  ],
  colorScheme: "light dark",
};

/** Applies a saved Light/Dark choice before first paint (no flash). "System" stores nothing. */
const THEME_SCRIPT = `try{var t=localStorage.getItem("cvl-theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-dvh overflow-x-clip bg-paper text-ink">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
