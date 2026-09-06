import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { isAdminHost } from "@/lib/admin/host";

export const metadata: Metadata = {
  title: { default: "پنل مدیریت اُزون", template: "%s | پنل مدیریت اُزون" },
  robots: { index: false, follow: false, noarchive: true, nosnippet: true },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const requestHeaders = await headers();
  if (!isAdminHost(requestHeaders.get("host"))) notFound();

  return children;
}
