import type { Metadata } from "next";
import { PageLoader } from "@/components/page-loader";
import { ScrollToTopButton } from "@/components/scroll-to-top";
import { defaultDescription, getPublicSiteUrl, homeTitle } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = { metadataBase: new URL(getPublicSiteUrl()), title: { default: homeTitle, template: "%s | اُزون" }, description: defaultDescription, openGraph: { type: "website", siteName: "اُزون", locale: "fa_IR", title: homeTitle, description: defaultDescription } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="fa" dir="rtl"><body>{children}<ScrollToTopButton /><PageLoader /></body></html>; }
