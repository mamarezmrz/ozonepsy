"use client";

import { AdminMutationForm } from "@/components/admin/admin-mutation-form";
import { AdminSelect } from "@/components/admin/admin-select";
import { faqPageDefinitions, type FaqPageKey } from "@/lib/public/faq-pages";

export function AdminContentForm({ type, action, values, successRedirect, initialFaqPage = "home" }: { type: "faq" | "testimonial"; action: string; values?: { question?: string; answer?: string; pageKey?: string; name?: string; body?: string; sortOrder?: number; avatarMediaId?: string | null }; successRedirect?: string; initialFaqPage?: FaqPageKey }) {
  const faqPageKey = values?.pageKey ?? initialFaqPage;
  return <AdminMutationForm action={action} method={values ? "PATCH" : "POST"} successRedirect={successRedirect}>
    {type === "faq" ? <><label className="admin-form-field"><span>صفحه</span>{values?.pageKey ? <><input type="hidden" name="pageKey" value={faqPageKey} /><span className="admin-readonly-value">{faqPageDefinitions.find((page) => page.key === faqPageKey)?.label ?? "صفحه اصلی"}</span></> : <AdminSelect name="pageKey" defaultValue={faqPageKey} ariaLabel="صفحهٔ سوال متداول" options={faqPageDefinitions.map((page) => ({ value: page.key, label: page.label }))} />}</label><label className="admin-form-field"><span>سوال</span><input name="question" defaultValue={values?.question ?? ""} required maxLength={2000} /></label><label className="admin-form-field"><span>پاسخ</span><textarea name="answer" defaultValue={values?.answer ?? ""} required maxLength={10000} /></label></> : <><label className="admin-form-field"><span>نام</span><input name="name" defaultValue={values?.name ?? ""} required maxLength={200} /></label><label className="admin-form-field"><span>متن نظر</span><textarea name="body" defaultValue={values?.body ?? ""} required maxLength={10000} /></label><label className="admin-form-field"><span>شناسه تصویر (اختیاری)</span><input name="avatarMediaId" defaultValue={values?.avatarMediaId ?? ""} dir="ltr" /></label></>}
    <label className="admin-form-field"><span>ترتیب نمایش</span><input name="sortOrder" type="number" min="0" defaultValue={values?.sortOrder ?? 0} required /></label>
  </AdminMutationForm>;
}
