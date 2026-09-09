import type { AdminSessionView } from "@/lib/admin/session";

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
    </header>
  );
}
