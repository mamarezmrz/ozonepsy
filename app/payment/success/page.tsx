import { Button } from "@/components/ui";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header-server";
import { createPageMetadata } from "@/lib/seo";
import { getCurrentUser } from "@/lib/auth/service";
import { formatDemoMoney } from "@/lib/payment-format";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@/lib/generated/prisma/enums";
export const metadata: Metadata = createPageMetadata("پرداخت موفق");
export default async function PaymentSuccessPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order } = await searchParams;
  const user = await getCurrentUser();
  const purchase = user && order
    ? await prisma.order.findFirst({
        where: { orderNumber: order, userId: user.id, status: OrderStatus.PAID },
        select: { orderNumber: true, productTitleSnapshot: true, totalMinor: true, currency: true },
      })
    : null;

  return (
    <>
      <SiteHeader />
      <main className="demo-payment-result-page">
        <div className="demo-payment-result-card">
          <div className="demo-payment-result-icon">✓</div>
          <h1>پرداخت با موفقیت تأیید شد</h1>
          {purchase ? (
            <>
              <p className="demo-payment-result-lead">خرید شما ثبت شد و دسترسی مربوط به آن فعال است.</p>
              <div className="demo-payment-order-details">
                <div><span>محصول</span><strong>{purchase.productTitleSnapshot}</strong></div>
                <div><span>مبلغ</span><strong dir="ltr">{formatDemoMoney(purchase.totalMinor, purchase.currency)}</strong></div>
                <div><span>شماره سفارش</span><strong dir="ltr">{purchase.orderNumber}</strong></div>
              </div>
            </>
          ) : (
            <p className="demo-payment-result-lead">دسترسی شما فعال شد و جزئیات خرید در داشبورد قابل مشاهده است.</p>
          )}
          <p className="demo-payment-no-charge">این یک پرداخت آزمایشی است و هیچ وجهی از شما کسر نشده است.</p>
          <Button href="/dashboard" className="mt-8">مشاهده خریدهای من</Button>
        </div>
      </main>
    </>
  );
}
