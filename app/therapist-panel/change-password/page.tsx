import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { TherapistPasswordForm } from "@/components/therapist-password-form";
import { getCurrentTherapist } from "@/lib/auth/therapist";

export const metadata: Metadata = { title: "تغییر رمز متخصص", robots: { index: false, follow: false } };

export default async function TherapistChangePasswordPage() {
  const therapist = await getCurrentTherapist();
  if (!therapist) redirect("/therapist-panel/login");
  if (!therapist.mustChangePassword) redirect("/therapist-panel");

  return <main className="flex min-h-screen items-center justify-center bg-[#fafcfc] px-5 py-10" dir="rtl">
    <section className="w-full max-w-[520px] rounded-[32px] bg-white p-6 shadow-[0_18px_60px_rgba(53,88,89,0.12)] sm:p-10">
      <div className="mb-8 text-center"><Image className="mx-auto" src="/ozone-logo.svg" alt="اُزون" width={64} height={64} priority /><h1 className="mt-5 text-2xl font-bold text-[#3b4040]">تغییر رمز موقت</h1><p className="mt-3 text-sm leading-7 text-[#676b6b]">برای امنیت حساب، پیش از ورود به پنل باید یک رمز شخصی جدید انتخاب کنید.</p></div>
      <TherapistPasswordForm firstLogin />
    </section>
  </main>;
}
