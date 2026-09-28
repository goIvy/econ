import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { GeistSans } from "geist/font/sans";
import { Providers } from "@/components/providers";
import "./globals.css";

const schibsted = localFont({
  src: "./fonts/SchibstedGrotesk-Variable.woff2",
  variable: "--font-schibsted",
  weight: "400 900",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://collegevaluelab.com"),
  title: {
    default: "College Value Lab: understand the real value of college",
    template: "%s | College Value Lab",
  },
  description:
    "Compare colleges, majors, tuition, debt, employment, salaries, and long-term financial outcomes using real economic data.",
  openGraph: {
    title: "College Value Lab",
    description:
      "Compare the real financial value of a specific college and major: net cost, debt, earnings, and break-even, with every number sourced.",
    type: "website",
    siteName: "College Value Lab",
  },
};

export const viewport: Viewport = {
  themeColor: "#f8f6f2",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${schibsted.variable}`}>
      <body className="min-h-dvh bg-paper text-ink">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
