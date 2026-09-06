import type { Metadata } from "next";
import { AdminButton, AdminPageHeader } from "@/components/admin/admin-ui";
import { AdminCategoryForm } from "@/components/admin/admin-category-form";
import { requireAdminPagePermission } from "@/lib/admin/page";
export const metadata: Metadata = { title: "دسته‌بندی جدید" };
export default async function NewCategoryPage() { await requireAdminPagePermission("categories.write"); return <div className="admin-page-stack"><AdminPageHeader title="دسته‌بندی جدید" action={<AdminButton href="/categories" variant="secondary">بازگشت</AdminButton>} /><section className="admin-panel-card"><AdminCategoryForm action="/api/admin/categories" successRedirect="/categories" /></section></div>; }
