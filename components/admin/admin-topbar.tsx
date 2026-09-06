import type { AdminSessionView } from "@/lib/admin/session";

export function AdminTopbar({}: { session: AdminSessionView }) {
  return (
    <header className="admin-topbar">
      <div>
        <span className="admin-topbar-title">پنل مدیریت</span>
      </div>
    </header>
  );
}
