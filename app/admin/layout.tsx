import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "پنل مدیریت اُزون", template: "%s | پنل مدیریت اُزون" },
  robots: { index: false, follow: false, noarchive: true, nosnippet: true },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
