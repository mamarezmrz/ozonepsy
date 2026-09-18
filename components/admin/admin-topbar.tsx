import type { AdminSessionView } from "@/lib/admin/session";
import { AdminNotificationsPanel } from "@/components/admin/admin-notifications-panel";

export function AdminTopbar({ onOpenMenu }: { session: AdminSessionView; onOpenMenu?: () => void }) {
  return (
    <header className="admin-topbar">
      <div className="admin-topbar-heading">
        <button type="button" className="admin-mobile-menu-toggle" aria-label="باز کردن منوی پنل مدیریت" aria-controls="admin-sidebar" onClick={onOpenMenu}>
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </button>
        <span className="admin-topbar-title">پنل مدیریت</span>
      </div>
      <div className="admin-topbar-actions">
        <AdminNotificationsPanel />
      </div>
    </header>
  );
}
