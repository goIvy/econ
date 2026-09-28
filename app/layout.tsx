import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
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
  themeColor: "#0b1020",
  colorScheme: "light dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={GeistSans.variable}>
      <body className="min-h-dvh bg-paper text-ink">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
