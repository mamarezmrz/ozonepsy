import type { Metadata } from "next";
import { AdminActionButton } from "@/components/admin/admin-action-button";
import { AdminButton, AdminPageHeader, AdminStatusBadge } from "@/components/admin/admin-ui";
import { AdminGroupTherapyForm } from "@/components/admin/admin-therapy-product-forms";
import { requireAdminPagePermission } from "@/lib/admin/page";
import { getAdminTherapyProduct } from "@/lib/admin/therapy-products";
import { ProductStatus } from "@/lib/generated/prisma/enums";

export const metadata: Metadata = { title: "جزئیات گروه‌درمانی" };
function statusLabel(status: ProductStatus) { return status === ProductStatus.PUBLISHED ? "منتشرشده" : status === ProductStatus.ARCHIVED ? "مخفی‌شده" : "پیش‌نویس"; }

export default async function GroupTherapyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminPagePermission("products.read");
  const { id } = await params;
  const product = await getAdminTherapyProduct("group", id);
  const canWrite = session.permissions.includes("products.write");
  const statusAction = product.status === ProductStatus.PUBLISHED ? { status: ProductStatus.ARCHIVED, label: "مخفی کردن", variant: "danger" as const, confirm: "این گروه‌درمانی از سایت مخفی شود؟" } : product.status === ProductStatus.ARCHIVED ? { status: ProductStatus.DRAFT, label: "نمایش دوباره", variant: "secondary" as const, confirm: "این گروه‌درمانی دوباره به پیش‌نویس برگردد؟" } : { status: ProductStatus.PUBLISHED, label: "انتشار", variant: "primary" as const, confirm: "این گروه‌درمانی در سایت منتشر شود؟" };
  const groupTherapy = product.groupTherapy as ({
    instructorName: string | null;
    durationSessions: number | null;
    sessions: Array<{ id: string; title: string; startsAt: Date }>;
  } | null);
  const formValues = {
    ...product,
    discountPercent: product.discountPercent,
    instructorName: groupTherapy?.instructorName,
    durationSessions: groupTherapy?.durationSessions,
    sessions: groupTherapy?.sessions.map((session) => ({ id: session.id, title: session.title, startsAt: session.startsAt.toISOString() })) ?? [],
  };
  return <div className="admin-page-stack"><AdminPageHeader eyebrow="Group Therapy / GroupTherapyProduct" title={product.title} description={`وضعیت فعلی: ${statusLabel(product.status)}`} action={<AdminButton href="/group-therapy" variant="secondary">بازگشت به گروه‌درمانی</AdminButton>} /><section className="admin-panel-card admin-course-create-card"><div className="admin-section-heading"><h3>ویرایش گروه‌درمانی</h3><AdminStatusBadge tone={product.status === ProductStatus.PUBLISHED ? "success" : product.status === ProductStatus.DRAFT ? "warning" : "neutral"}>{statusLabel(product.status)}</AdminStatusBadge></div>{canWrite ? <AdminGroupTherapyForm productId={product.id} values={formValues} /> : <dl className="admin-detail-list"><div><dt>Slug</dt><dd dir="ltr">{product.slug}</dd></div><div><dt>توضیحات</dt><dd className="admin-course-description">{product.description}</dd></div><div><dt>قیمت</dt><dd dir="ltr">{(product.priceMinor / 100).toLocaleString("fa-IR")} {product.currency}</dd></div></dl>}{canWrite ? <div className="admin-form-actions"><AdminActionButton action={`/api/admin/group-therapy/${product.id}/status`} method="PATCH" body={{ status: statusAction.status, ...(statusAction.status === ProductStatus.PUBLISHED ? { reason: "انتشار گروه‌درمانی" } : {}) }} label={statusAction.label} variant={statusAction.variant} reasonRequired={statusAction.status !== ProductStatus.PUBLISHED} confirm={statusAction.status === ProductStatus.PUBLISHED ? undefined : statusAction.confirm} successMessage={statusAction.status === ProductStatus.PUBLISHED ? "گروه‌درمانی منتشر شد و در سایت نمایش داده می‌شود." : `وضعیت گروه‌درمانی به «${statusAction.label}» تغییر کرد.`} /><AdminActionButton action={`/api/admin/group-therapy/${product.id}`} method="DELETE" label="حذف گروه‌درمانی" variant="danger" confirm="این گروه‌درمانی برای همیشه حذف شود؟ اگر سابقه خرید یا جلسه داشته باشد حذف انجام نمی‌شود." successMessage="گروه‌درمانی حذف شد." /></div> : null}</section></div>;
}
