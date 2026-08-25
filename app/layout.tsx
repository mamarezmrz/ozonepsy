import type { Metadata } from "next";
import localFont from "next/font/local";
import { PageLoader } from "@/components/page-loader";
import { ScrollToTopButton } from "@/components/scroll-to-top";
import { defaultDescription, homeTitle } from "@/lib/seo";
import "./globals.css";

const ozoneFont = localFont({
  src: "../public/fonts/BYekan+.ttf",
  variable: "--font-ozone",
  display: "swap",
  weight: "400",
  style: "normal",
});

export const metadata: Metadata = { title: { default: homeTitle, template: "%s | اُزون" }, description: defaultDescription };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="fa" dir="rtl"><body className={ozoneFont.variable}>{children}<ScrollToTopButton /><PageLoader /></body></html>; }
