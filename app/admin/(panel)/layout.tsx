import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { getCurrentAdminSession } from "@/lib/admin/session";

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentAdminSession();
  if (!session) redirect("/login");

  return <AdminShell session={session}>{children}</AdminShell>;
}
