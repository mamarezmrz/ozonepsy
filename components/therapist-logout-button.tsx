"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function TherapistLogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    try {
      await fetch("/api/therapists/logout", { method: "POST" });
    } finally {
      router.push("/therapist-panel/login");
      router.refresh();
    }
  }

  return <button type="button" onClick={() => void logout()} disabled={pending} className="rounded-xl border border-[#f0c7c7] px-4 py-2 text-sm font-bold text-[#db4244] transition hover:bg-[#fff5f5] disabled:opacity-60">{pending ? "در حال خروج…" : "خروج"}</button>;
}
