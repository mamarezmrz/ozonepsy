import type { Metadata } from "next";

export const siteName = "اُزون";
export const homeTitle = "اُزون | مشاوره آنلاین روانشناسی";
export const defaultDescription = "مشاوره آنلاین روانشناسی فردی و گروهی برای ایرانیان خارج از کشور.";

export function createPageMetadata(title: string, description?: string): Metadata {
  return {
    title: { absolute: `${title} | ${siteName}` },
    ...(description ? { description } : {}),
  };
}
