import type { Metadata } from "next";
import { AdminButton, AdminPageHeader } from "@/components/admin/admin-ui";
import { TherapistProfileForm } from "@/components/therapist-profile-form";
import { TherapistPasswordForm } from "@/components/therapist-password-form";
import { requireTherapist } from "@/lib/auth/therapist";

export const metadata: Metadata = { title: "پروفایل متخصص", robots: { index: false, follow: false } };

export default async function TherapistProfilePage() {
  const therapist = await requireTherapist();
  return <div className="admin-page-stack"><AdminPageHeader eyebrow="حساب متخصص" title="پروفایل و تنظیمات" description="اطلاعات حساب، اطلاعات حرفه‌ای، تصویر و محتوای صفحه عمومی خود را به‌روز کنید." action={<AdminButton href={`/therapists/${encodeURIComponent(therapist.specialist.slug)}`} variant="secondary">پروفایل عمومی</AdminButton>} /><div className="admin-detail-grid therapist-profile-layout"><section className="admin-panel-card"><h3>اطلاعات متخصص و صفحه عمومی</h3><TherapistProfileForm values={therapist.specialist} /></section><section className="admin-panel-card"><h3>تغییر رمز عبور</h3><p className="therapist-panel-description">برای حفظ امنیت حساب، رمز ورود خود را به‌روز نگه دارید.</p><TherapistPasswordForm /></section></div></div>;
}
