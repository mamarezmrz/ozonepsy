import type { Metadata } from "next";
import { AdminButton, AdminPageHeader } from "@/components/admin/admin-ui";
import { AdminMutationForm } from "@/components/admin/admin-mutation-form";
import { AdminCountrySelect, AdminLatinPasswordInput } from "@/components/admin/admin-user-fields";
import { requireAdminPagePermission } from "@/lib/admin/page";

export const metadata: Metadata = { title: "ساخت کاربر" };

export default async function NewUserPage() {
  await requireAdminPagePermission("users.update");
  return <div className="admin-page-stack">
    <AdminPageHeader eyebrow="مدیریت کاربران" title="ساخت کاربر" description="یک حساب کاربری عمومی بسازید. رمز اولیه را امن و مستقیم به خود کاربر تحویل دهید." action={<AdminButton href="/admin/users" variant="secondary">بازگشت</AdminButton>} />
    <section className="admin-panel-card">
      <AdminMutationForm action="/api/admin/users" successRedirect="/admin/users" submitLabel="ساخت کاربر" notification successMessage="کاربر جدید ایجاد شد.">
        <div className="admin-course-form-grid">
          <label className="admin-form-field"><span>نام و نام خانوادگی</span><input name="fullName" autoComplete="name" required /></label>
          <label className="admin-form-field"><span>شماره تلفن</span><input name="phone" autoComplete="tel" dir="ltr" required /></label>
          <label className="admin-form-field"><span>ایمیل</span><input type="email" name="email" required autoComplete="email" dir="ltr" /></label>
          <label className="admin-form-field"><span>کشور</span><AdminCountrySelect name="country" ariaLabel="کشور" /></label>
          <label className="admin-form-field"><span>رمز (حداقل ۱۲ کاراکتر)</span><AdminLatinPasswordInput name="password" required /></label>
          <label className="admin-form-field"><span>تایید رمز</span><AdminLatinPasswordInput name="confirmPassword" required /></label>
        </div>
      </AdminMutationForm>
    </section>
  </div>;
}
