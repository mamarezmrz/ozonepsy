import type { Metadata } from "next";
import localFont from "next/font/local";
import { ScrollToTopButton } from "@/components/scroll-to-top";
import "./globals.css";

const ozoneFont = localFont({
  src: "../public/fonts/BYekan+.ttf",
  variable: "--font-ozone",
  display: "swap",
  weight: "400",
  style: "normal",
});

export const metadata: Metadata = { title: { default: "اُزون | مشاوره آنلاین روانشناسی", template: "%s | اُزون" }, description: "مشاوره آنلاین روانشناسی فردی و گروهی برای ایرانیان خارج از کشور." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="fa" dir="rtl"><body className={ozoneFont.variable}>{children}<ScrollToTopButton /></body></html>; }
