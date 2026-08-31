import type { AdminSessionView } from "@/lib/admin/session";

export function AdminTopbar({}: { session: AdminSessionView }) {
  return (
    <header className="admin-topbar">
      <div>
        <h1>پنل مدیریت</h1>
      </div>
    </header>
  );
}
