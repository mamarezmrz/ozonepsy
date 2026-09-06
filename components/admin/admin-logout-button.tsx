"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminLogoutButton() {
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function logout() {
    setPending(true);
    try {
      await fetch("/api/admin/auth/logout", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
      });
    } finally {
      router.replace("/admin/login");
    }
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={pending}
      className="admin-logout-button"
    >
      {pending ? "در حال خروج…" : "خروج از پنل"}
    </button>
  );
}
