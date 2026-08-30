import type { Metadata } from "next";
import { AdminLoginForm } from "@/components/admin/admin-login-form";

export const metadata: Metadata = {
  title: "ورود مدیر",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fafcfc] px-5 py-10">
      <section className="w-full max-w-[460px] rounded-[32px] bg-white p-6 shadow-[0_18px_60px_rgba(53,88,89,0.12)] sm:p-10">
        <div className="mb-10 text-center">
          <p className="text-sm text-[#0f8b8d]">اُزون</p>
          <h1 className="mt-3 text-3xl font-bold text-[#3b4040]">ورود به پنل مدیریت</h1>
          <p className="mt-3 text-sm leading-7 text-[#676b6b]">برای ادامه، اطلاعات دسترسی مدیر را وارد کنید.</p>
        </div>
        <AdminLoginForm />
      </section>
    </main>
  );
}
