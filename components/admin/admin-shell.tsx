import type { AdminSessionView } from "@/lib/admin/session";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";

export function AdminShell({ session, children }: { session: AdminSessionView; children: React.ReactNode }) {
  return (
    <div className="admin-shell" dir="rtl">
      <AdminSidebar session={session} />
      <div className="admin-main">
        <AdminTopbar session={session} />
        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}
