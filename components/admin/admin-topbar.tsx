/* Avatar URLs are validated at the profile/media boundary; this foundation
   keeps the admin shell compatible with local and future object storage URLs. */
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import type { AdminSessionView } from "@/lib/admin/session";

export function AdminTopbar({ session }: { session: AdminSessionView }) {
  const identity = session.displayName?.trim() || session.email;

  return (
    <header className="admin-topbar">
      <div>
        <p className="admin-eyebrow">اُزون</p>
        <h1>پنل مدیریت</h1>
      </div>
      <div className="admin-topbar-actions">
        <Link href="/" className="admin-public-link">مشاهده سایت</Link>
        <div className="admin-identity" title={identity}>
          <span className="admin-identity-avatar" aria-hidden="true">
            {session.avatarUrl ? <img src={session.avatarUrl} alt="" /> : identity.slice(0, 1).toUpperCase()}
          </span>
          <span>
            <strong>{identity}</strong>
            <small>{session.roles.join("، ")}</small>
          </span>
        </div>
      </div>
    </header>
  );
}
