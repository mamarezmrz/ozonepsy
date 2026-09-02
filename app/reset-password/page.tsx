import type { Metadata } from "next";
import { Suspense } from "react";
import { PasswordRecoveryPage } from "@/components/password-recovery-page";

export const metadata: Metadata = { title: "تعیین رمز جدید", robots: { index: false, follow: false } };

export default function ResetPasswordPage() {
  return <Suspense fallback={<main className="auth-page"><section className="auth-card" aria-busy="true">در حال بارگذاری…</section></main>}><PasswordRecoveryPage mode="reset" /></Suspense>;
}
