import { randomUUID } from "node:crypto";
import { products, type Product } from "@/lib/data";
import { prisma } from "@/lib/prisma";
export { formatDemoMoney } from "@/lib/payment-format";
import {
  CourseDeliveryMode,
  EntitlementStatus,
  OrderStatus,
  PaymentStatus,
  ProductKind,
  ProductStatus,
} from "@/lib/generated/prisma/enums";

export type DemoCheckoutProduct = Product & {
  sessions?: number;
  priceMinor: number;
  currency: string;
};

type DemoProductDefinition = DemoCheckoutProduct & {
  dbKind: ProductKind;
};

const packageThree: DemoProductDefinition = {
  id: "package-3",
  slug: "three-session-package",
  title: "بسته ۳ جلسه‌ای مشاوره",
  kind: "package",
  category: "مشاوره فردی",
  description: "برای ساختن یک مسیر منظم و پیوسته در کنار مشاور.",
  price: 104.8,
  priceMinor: 10480,
  currency: "USD",
  sessions: 3,
  duration: "۳ × ۵۰ دقیقه",
  accent: "from-[#cc6f39] to-[#eba983]",
  label: "به‌صرفه‌تر",
  dbKind: ProductKind.PACKAGE,
};

function toDatabaseKind(kind: Product["kind"]): ProductKind {
  switch (kind) {
    case "consultation":
      return ProductKind.CONSULTATION;
    case "package":
      return ProductKind.PACKAGE;
    case "group":
      return ProductKind.GROUP;
    case "course":
      return ProductKind.COURSE;
  }
}

const demoDefinitions: DemoProductDefinition[] = [
  packageThree,
  ...products.map((product) => {
    // The pricing screen exposes these package prices. The server remains the
    // authority for the amount and persists the resolved value in the order.
    const price = product.id === "individual-1" ? 49.9 : product.id === "package-6" ? 179.9 : product.price;
    return {
      ...product,
      price,
      priceMinor: Math.round(price * 100),
      currency: "USD",
      dbKind: toDatabaseKind(product.kind),
    };
  }),
];

const aliases: Record<string, string> = {
  "life-skills-course": "life-skills",
};

export class DemoPaymentError extends Error {
  constructor(message: string, public readonly status = 400) {
    super(message);
    this.name = "DemoPaymentError";
  }
}

export function getDemoCheckoutProduct(productId: string): DemoProductDefinition | null {
  const resolvedId = aliases[productId] ?? productId;
  return demoDefinitions.find((product) => product.id === resolvedId) ?? null;
}

function orderNumber(): string {
  return `OZ-DEMO-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

export async function createDemoPurchase(userId: string, productId: string) {
  const definition = getDemoCheckoutProduct(productId);
  if (!definition) {
    throw new DemoPaymentError("محصول انتخاب‌شده پیدا نشد.", 404);
  }

  return prisma.$transaction(async (tx) => {
    let product = await tx.product.findUnique({ where: { slug: definition.slug } });

    if (product && product.kind !== definition.dbKind) {
      throw new DemoPaymentError("پیکربندی محصول معتبر نیست.", 409);
    }

    if (!product) {
      product = await tx.product.create({
        data: {
          slug: definition.slug,
          title: definition.title,
          description: definition.description,
          kind: definition.dbKind,
          status: ProductStatus.PUBLISHED,
          priceMinor: definition.priceMinor,
          currency: definition.currency,
          accent: definition.accent,
          label: definition.label,
          featured: Boolean(definition.featured),
        },
      });
    }

    if (product.status !== ProductStatus.PUBLISHED) {
      throw new DemoPaymentError("این محصول در حال حاضر قابل خرید نیست.", 409);
    }

    if (definition.dbKind === ProductKind.CONSULTATION) {
      const config = await tx.consultationProduct.findUnique({ where: { productId: product.id } });
      if (!config) {
        await tx.consultationProduct.create({ data: { productId: product.id, durationMinutes: 50 } });
      }
    }

    if (definition.dbKind === ProductKind.PACKAGE) {
      const config = await tx.sessionPackage.findUnique({ where: { productId: product.id } });
      if (!config) {
        await tx.sessionPackage.create({
          data: {
            productId: product.id,
            includedSessions: definition.sessions ?? 1,
          },
        });
      }
    }

    if (definition.dbKind === ProductKind.GROUP) {
      const config = await tx.groupTherapyProduct.findUnique({ where: { productId: product.id } });
      if (!config) {
        await tx.groupTherapyProduct.create({
          data: {
            productId: product.id,
            cohortLabel: "گروه درمانی آنلاین",
            schedulePolicy: "جلسات هفتگی",
          },
        });
      }
    }

    if (definition.dbKind === ProductKind.COURSE) {
      const config = await tx.courseProduct.findUnique({ where: { productId: product.id } });
      if (!config) {
        await tx.courseProduct.create({
          data: { productId: product.id, deliveryMode: CourseDeliveryMode.RECORDED },
        });
      }
    }

    const persistedProduct = await tx.product.findUnique({
      where: { id: product.id },
      include: { consultation: true, sessionPackage: true, groupTherapy: true, course: true },
    });
    if (!persistedProduct) {
      throw new DemoPaymentError("محصول خریداری‌شده پیدا نشد.", 404);
    }

    const totalSessions =
      persistedProduct.kind === ProductKind.CONSULTATION
        ? 1
        : persistedProduct.kind === ProductKind.PACKAGE
          ? persistedProduct.sessionPackage?.includedSessions ?? definition.sessions ?? 1
          : persistedProduct.kind === ProductKind.GROUP
            ? definition.sessions ?? 4
            : null;

    const createdAt = new Date();
    const number = orderNumber();
    const transactionId = `demo_tx_${randomUUID()}`;
    const authority = `demo_auth_${randomUUID()}`;
    const referenceId = `demo_ref_${randomUUID()}`;

    const order = await tx.order.create({
      data: {
        orderNumber: number,
        userId,
        productId: persistedProduct.id,
        status: OrderStatus.PAID,
        totalMinor: persistedProduct.priceMinor,
        currency: persistedProduct.currency,
        productTitleSnapshot: persistedProduct.title,
        snapshot: {
          title: persistedProduct.title,
          slug: persistedProduct.slug,
          kind: persistedProduct.kind,
          priceMinor: persistedProduct.priceMinor,
          currency: persistedProduct.currency,
          totalSessions,
          provider: "DEMO_STRIPE",
        },
        createdAt,
      },
    });

    await tx.payment.create({
      data: {
        orderId: order.id,
        provider: "DEMO_STRIPE",
        status: PaymentStatus.VERIFIED,
        amountMinor: persistedProduct.priceMinor,
        currency: persistedProduct.currency,
        attempt: 1,
        providerTransactionId: transactionId,
        authority,
        referenceId,
        verifiedAt: createdAt,
      },
    });

    const purchase = await tx.purchase.create({
      data: {
        orderId: order.id,
        userId,
        productId: persistedProduct.id,
        amountMinor: persistedProduct.priceMinor,
        currency: persistedProduct.currency,
        verifiedAt: createdAt,
      },
    });

    const entitlement = await tx.entitlement.create({
      data: {
        purchaseId: purchase.id,
        userId,
        productId: persistedProduct.id,
        status: EntitlementStatus.ACTIVE,
        totalSessions,
        startsAt: createdAt,
      },
    });

    if (persistedProduct.kind === ProductKind.COURSE && persistedProduct.course) {
      await tx.enrollment.create({
        data: {
          entitlementId: entitlement.id,
          userId,
          courseProductId: persistedProduct.course.productId,
        },
      });
    }

    return { orderNumber: order.orderNumber, orderId: order.id };
  });
}
