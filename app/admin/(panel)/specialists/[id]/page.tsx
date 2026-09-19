import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminActionButton } from "@/components/admin/admin-action-button";
import { AdminButton, AdminDataTable, AdminEmptyState, AdminPageHeader, AdminStatusBadge } from "@/components/admin/admin-ui";
import { AdminSpecialistForm } from "@/components/admin/admin-specialist-form";
import { AdminMutationForm } from "@/components/admin/admin-mutation-form";
import { AdminLatinPasswordInput } from "@/components/admin/admin-user-fields";
import { AdminSelect } from "@/components/admin/admin-select";
import { AdminDatePicker } from "@/components/admin/admin-date-picker";
import { AdminDetailsButton } from "@/components/admin/admin-details-button";
import { requireAdminPagePermission } from "@/lib/admin/page";
import { getAdminSpecialist } from "@/lib/admin/specialists";
import { listAdminSpecialistPayouts } from "@/lib/admin/specialist-payouts";
import { AdminServiceError } from "@/lib/admin/errors";
import { SpecialistPayoutStatus, SpecialistStatus, UserStatus } from "@/lib/generated/prisma/enums";

export const metadata: Metadata = { title: "ویرایش متخصص" };

export default async function EditSpecialistPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminPagePermission("instructors.read");
  const { id } = await params;
  let specialist;
  try {
    specialist = await getAdminSpecialist(id, session);
  } catch (error) {
    if (error instanceof AdminServiceError && error.code === "NOT_FOUND") notFound();
    throw error;
  }
  const canWrite = session.permissions.includes("instructors.write");
  const payouts = await listAdminSpecialistPayouts(id, session);
  const payoutStatusLabels: Record<SpecialistPayoutStatus, string> = { PENDING: "در انتظار پرداخت", PAID: "پرداخت‌شده", CANCELED: "لغوشده" };
  const payoutStatusTone = (status: SpecialistPayoutStatus) => status === SpecialistPayoutStatus.PAID ? "success" as const : status === SpecialistPayoutStatus.CANCELED ? "danger" as const : "warning" as const;
  const formatPayoutAmount = (amountMinor: number, currency: string) => new Intl.NumberFormat("fa-IR", { style: "currency", currency, minimumFractionDigits: 2 }).format(amountMinor / 100);
  return <div className="admin-page-stack">
    <AdminPageHeader eyebrow="مدیریت متخصص ها / ویرایش صفحه عمومی" title={specialist.displayName} description="اطلاعات متخصص و محتوای صفحه عمومی او را ویرایش کنید؛ پیش‌نمایش زنده در کنار فرم نمایش داده می‌شود." action={<AdminButton href="/admin/specialists" variant="secondary">بازگشت</AdminButton>} />
    <section className="admin-panel-card">
      <div className="admin-section-heading"><h2>اطلاعات متخصص</h2><AdminStatusBadge tone={specialist.status === SpecialistStatus.ACTIVE ? "success" : "neutral"}>{specialist.status === SpecialistStatus.ACTIVE ? "فعال" : "غیرفعال"}</AdminStatusBadge></div>
      {canWrite ? <AdminSpecialistForm action={`/api/admin/specialists/${id}`} method="PATCH" livePreview successRedirect="/admin/specialists" values={{ ...specialist, email: specialist.user?.email ?? specialist.email, hasAccount: Boolean(specialist.userId), accountActive: specialist.user ? specialist.user.status === UserStatus.ACTIVE && specialist.status === SpecialistStatus.ACTIVE : specialist.status === SpecialistStatus.ACTIVE }} /> : <dl className="admin-detail-list"><div><dt>نام و نام خانوادگی</dt><dd>{specialist.displayName}</dd></div><div><dt>تخصص</dt><dd>{specialist.specialty || "—"}</dd></div><div><dt>شماره تماس</dt><dd dir="ltr">{specialist.phone || "—"}</dd></div><div><dt>کشور</dt><dd>{specialist.country || "—"}</dd></div><div><dt>ایمیل ورود</dt><dd dir="ltr">{specialist.user?.email ?? specialist.email ?? "—"}</dd></div></dl>}
    </section>
    {canWrite && specialist.pendingProfileChange ? <section className="admin-panel-card"><div className="admin-section-heading"><div><h2>تغییرات در انتظار تأیید</h2><p className="admin-muted-copy">این اطلاعات تا زمان تأیید مدیریت در صفحه عمومی متخصص نمایش داده نمی‌شود.</p></div><AdminStatusBadge tone="warning">در انتظار بررسی</AdminStatusBadge></div><dl className="admin-detail-list"><div><dt>نام و نام خانوادگی</dt><dd>{specialist.pendingProfileChange.displayName}</dd></div><div><dt>ایمیل</dt><dd dir="ltr">{specialist.pendingProfileChange.email}</dd></div><div><dt>تخصص</dt><dd>{specialist.pendingProfileChange.specialty || "—"}</dd></div><div><dt>شماره تماس</dt><dd dir="ltr">{specialist.pendingProfileChange.phone || "—"}</dd></div><div><dt>کشور</dt><dd>{specialist.pendingProfileChange.country || "—"}</dd></div></dl><div className="admin-form-actions"><AdminActionButton action={`/api/admin/specialists/${id}/profile-approval`} method="POST" body={{ action: "approve" }} label="تأیید تغییرات" variant="primary" successMessage="تغییرات متخصص تأیید شد." /><AdminActionButton action={`/api/admin/specialists/${id}/profile-approval`} method="POST" body={{ action: "reject" }} label="رد تغییرات" variant="danger" confirm="تغییرات ارسال‌شده توسط متخصص رد شود؟" successMessage="تغییرات متخصص رد شد." /></div></section> : null}
    {canWrite && specialist.userId ? <section className="admin-panel-card"><h2>تغییر رمز متخصص</h2><p className="admin-muted-copy">رمز جدید به‌صورت موقت تنظیم می‌شود و متخصص در ورود بعدی باید آن را تغییر دهد.</p><AdminMutationForm action={`/api/admin/specialists/${id}/password`} method="POST" submitLabel="تنظیم رمز جدید" notification successMessage="رمز متخصص تنظیم شد و نشست‌های قبلی بسته شدند.">
      <div className="admin-course-form-grid"><label className="admin-form-field"><span>رمز موقت جدید</span><AdminLatinPasswordInput name="password" minLength={12} required /></label><label className="admin-form-field"><span>تکرار رمز موقت</span><AdminLatinPasswordInput name="confirmPassword" minLength={12} required /></label></div>
      <label className="admin-form-field"><span>دلیل تغییر رمز</span><input name="reason" maxLength={1000} required /></label>
    </AdminMutationForm></section> : null}
    <section className="admin-panel-card"><div className="admin-section-heading"><div><h2>پرداخت‌های متخصص</h2><p className="admin-muted-copy">پرداخت‌هایی که برای این متخصص ثبت شده‌اند در این آرشیو دیده می‌شوند.</p></div></div>{canWrite ? <AdminMutationForm className="admin-form-stack admin-specialist-payout-form" action={`/api/admin/specialists/${id}/payouts`} method="POST" submitLabel="ثبت پرداخت" notification successMessage="پرداخت متخصص ثبت شد."><div className="admin-course-form-grid"><label className="admin-form-field"><span>مبلغ</span><input name="amountMajor" type="text" inputMode="decimal" dir="ltr" placeholder="مثلاً 500" required /></label><label className="admin-form-field"><span>واحد پولی</span><AdminSelect name="currency" defaultValue="USD" ariaLabel="واحد پولی پرداخت" options={[{ value: "USD", label: "دلار آمریکا" }, { value: "CAD", label: "دلار کانادا" }, { value: "EUR", label: "یورو" }]} /></label><label className="admin-form-field"><span>وضعیت</span><AdminSelect name="status" defaultValue="PAID" ariaLabel="وضعیت پرداخت" options={[{ value: "PAID", label: "پرداخت‌شده" }, { value: "PENDING", label: "در انتظار پرداخت" }, { value: "CANCELED", label: "لغوشده" }]} /></label><label className="admin-form-field"><span>تاریخ پرداخت</span><AdminDatePicker name="paidAt" ariaLabel="تاریخ پرداخت" /></label><label className="admin-form-field"><span>شناسه پرداخت (اختیاری)</span><input name="reference" dir="ltr" maxLength={200} /></label><label className="admin-form-field admin-form-field-full"><span>توضیحات (اختیاری)</span><textarea name="note" rows={3} maxLength={10000} /></label></div></AdminMutationForm> : null}{payouts.length ? <AdminDataTable rows={payouts} getRowKey={(row) => row.id} columns={[{ key: "amount", label: "مبلغ", render: (row) => <span dir="ltr">{formatPayoutAmount(row.amountMinor, row.currency)}</span> }, { key: "status", label: "وضعیت", render: (row) => <AdminStatusBadge tone={payoutStatusTone(row.status)}>{payoutStatusLabels[row.status]}</AdminStatusBadge> }, { key: "date", label: "تاریخ پرداخت", render: (row) => row.paidAt ? <time dateTime={row.paidAt.toISOString()}>{row.paidAt.toLocaleDateString("fa-IR-u-ca-gregory")}</time> : <span>—</span> }, { key: "reference", label: "شناسه", render: (row) => <span dir="ltr">{row.reference || "—"}</span> }, { key: "note", label: "توضیحات", render: (row) => <AdminDetailsButton title="توضیحات پرداخت" description={row.note} /> }]} /> : <AdminEmptyState title="پرداختی ثبت نشده است" description="با ثبت اولین پرداخت، آرشیو آن در این بخش و پنل متخصص نمایش داده می‌شود." />}</section>
  </div>;
}
