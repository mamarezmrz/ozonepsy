import type { Metadata } from "next";

export const siteName = "اُزون";
export const homeTitle = "اُزون | مشاوره آنلاین روانشناسی";
export const defaultDescription = "مشاوره آنلاین روانشناسی فردی و گروهی برای ایرانیان خارج از کشور.";

export function getPublicSiteUrl() {
  const configured = process.env.PUBLIC_SITE_URL?.trim();
  if (!configured) return "http://localhost:3000";
  try { return new URL(configured).toString().replace(/\/$/, ""); } catch { return "http://localhost:3000"; }
}

export function createPageMetadata(title: string, description?: string): Metadata {
  return {
    title: { absolute: `${title} | ${siteName}` },
    ...(description ? { description } : {}),
    metadataBase: new URL(getPublicSiteUrl()),
  };
}
