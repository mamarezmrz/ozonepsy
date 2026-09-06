import { randomUUID } from "node:crypto";
import { EntitlementStatus, OrderStatus, PaymentStatus, ProductKind, ProductStatus } from "@/lib/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { getPublishedProductByIdOrSlug } from "@/lib/public/catalog";
import type { PublicPurchaseProduct } from "@/lib/public/catalog-types";

export { formatDemoMoney } from "@/lib/payment-format";

export type DemoCheckoutProduct = PublicPurchaseProduct & { dbKind: ProductKind };

export class DemoPaymentError extends Error {
  public readonly code: "NOT_FOUND" | "CONFLICT" | "VALIDATION_ERROR";

  constructor(
    message: string,
    public readonly status = 400,
    code: "NOT_FOUND" | "CONFLICT" | "VALIDATION_ERROR" = "VALIDATION_ERROR",
  ) {
    super(message);
    this.name = "DemoPaymentError";
    this.code = code;
  }
}

export async function getDemoCheckoutProduct(productId: string): Promise<DemoCheckoutProduct | null> {
  const product = await getPublishedProductByIdOrSlug(productId);
  if (!product) return null;
  return { ...product, dbKind: product.kind.toUpperCase() as ProductKind };
}

function orderNumber(): string {
  return `OZ-DEMO-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

export async function createDemoPurchase(userId: string, productId: string) {
  const definition = await getDemoCheckoutProduct(productId);
  if (!definition) throw new DemoPaymentError("محصول انتخاب‌شده پیدا نشد.", 404, "NOT_FOUND");

  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({
      where: { id: definition.id },
      include: { consultation: true, sessionPackage: true, groupTherapy: true, course: true },
    });
    if (!product || product.kind !== definition.dbKind) throw new DemoPaymentError("پیکربندی محصول معتبر نیست.", 409, "CONFLICT");
    if (product.status !== ProductStatus.PUBLISHED) throw new DemoPaymentError("این محصول در حال حاضر قابل خرید نیست.", 409, "CONFLICT");

    if (product.kind === ProductKind.COURSE || product.kind === ProductKind.GROUP) {
      const existing = await tx.entitlement.findFirst({
        where: { userId, productId: product.id, status: EntitlementStatus.ACTIVE },
        orderBy: { createdAt: "desc" },
        select: { purchase: { select: { order: { select: { id: true, orderNumber: true } } } } },
      });
      if (existing?.purchase.order) return { orderNumber: existing.purchase.order.orderNumber, orderId: existing.purchase.order.id };
    }

    const totalSessions = product.kind === ProductKind.CONSULTATION
      ? 1
      : product.kind === ProductKind.PACKAGE
        ? product.sessionPackage?.includedSessions ?? 1
        : product.kind === ProductKind.GROUP
          ? 4
          : null;
    const createdAt = new Date();
    const order = await tx.order.create({
      data: {
        orderNumber: orderNumber(),
        userId,
        productId: product.id,
        status: OrderStatus.PAID,
        totalMinor: product.priceMinor,
        currency: product.currency,
        productTitleSnapshot: product.title,
        snapshot: { title: product.title, slug: product.slug, kind: product.kind, priceMinor: product.priceMinor, currency: product.currency, totalSessions, provider: "DEMO_STRIPE" },
        createdAt,
      },
    });
    await tx.payment.create({
      data: {
        orderId: order.id,
        provider: "DEMO_STRIPE",
        status: PaymentStatus.VERIFIED,
        amountMinor: product.priceMinor,
        currency: product.currency,
        attempt: 1,
        providerTransactionId: `demo_tx_${randomUUID()}`,
        authority: `demo_auth_${randomUUID()}`,
        referenceId: `demo_ref_${randomUUID()}`,
        verifiedAt: createdAt,
      },
    });
    const purchase = await tx.purchase.create({ data: { orderId: order.id, userId, productId: product.id, amountMinor: product.priceMinor, currency: product.currency, verifiedAt: createdAt } });
    const entitlement = await tx.entitlement.create({ data: { purchaseId: purchase.id, userId, productId: product.id, status: EntitlementStatus.ACTIVE, totalSessions, startsAt: createdAt } });
    if (product.kind === ProductKind.COURSE && product.course) {
      await tx.enrollment.create({ data: { entitlementId: entitlement.id, userId, courseProductId: product.course.productId } });
    }
    return { orderNumber: order.orderNumber, orderId: order.id };
  });
}
