import { randomUUID } from "node:crypto";
import { ProductKind, ProductStatus } from "@/lib/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { recordAdminAuditWithClient } from "@/lib/admin/audit";
import { AdminServiceError } from "@/lib/admin/errors";
import { pageMeta, paginationOffset, type AdminListQuery } from "@/lib/admin/query";

export type AdminGroupTherapyInput = {
  title: string;
  slug: string;
  description: string;
  priceMinor: number;
  discountPercent: number;
  currency: string;
  coverMediaId?: string | null;
  instructorName?: string;
  durationSessions?: number | null;
  sessions: Array<{ title: string; startsAt: Date }>;
};

export type AdminIndividualConsultationInput = {
  title: string;
  slug: string;
  description: string;
  priceMinor: number;
  discountPercent: number;
  currency: string;
  durationMinutes: number;
  includedSessions: number;
};

const managedSelect = {
  id: true,
  slug: true,
  title: true,
  description: true,
  priceMinor: true,
  currency: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  coverMediaId: true,
  coverMedia: { select: { id: true, originalName: true, visibility: true } },
  groupTherapy: { select: { productId: true } },
  consultation: { select: { durationMinutes: true } },
  sessionPackage: { select: { includedSessions: true } },
} as const;

const kindBySection = {
  group: ProductKind.GROUP,
  consultation: ProductKind.CONSULTATION,
} as const;

type ManagedSection = keyof typeof kindBySection;

type AdminGroupTherapyDetailRow = {
  instructorName: string | null;
  durationSessions: number | null;
  sessionId: string | null;
  sessionTitle: string | null;
  sessionStartsAt: Date | string | null;
  sessionOrder: number | null;
};

async function getGroupTherapyDetails(productId: string) {
  const rows = await prisma.$queryRaw<AdminGroupTherapyDetailRow[]>`
    SELECT
      g."instructorName" AS "instructorName",
      g."durationSessions" AS "durationSessions",
      s."id" AS "sessionId",
      s."title" AS "sessionTitle",
      s."startsAt" AS "sessionStartsAt",
      s."order" AS "sessionOrder"
    FROM "GroupTherapyProduct" g
    LEFT JOIN "GroupTherapySession" s ON s."groupTherapyProductId" = g."productId"
    WHERE g."productId" = ${productId}
    ORDER BY s."order" ASC
  `;
  const details = rows[0];
  return {
    instructorName: details?.instructorName ?? null,
    durationSessions: details?.durationSessions ?? null,
    sessions: rows.filter((row) => row.sessionId && row.sessionTitle && row.sessionStartsAt !== null).map((row) => ({
      id: row.sessionId as string,
      title: row.sessionTitle as string,
      startsAt: new Date(row.sessionStartsAt as Date | string),
      order: row.sessionOrder ?? 0,
    })),
  };
}

function normalizeBase(input: { title: string; slug: string; description: string; priceMinor: number; discountPercent: number; currency: string }) {
  const title = input.title.trim();
  const slug = input.slug.trim().toLowerCase();
  const description = input.description.trim();
  const currency = input.currency.trim().toUpperCase().slice(0, 3);
  if (!title || !slug || !description || !currency || input.priceMinor < 0) {
    throw new AdminServiceError("VALIDATION_ERROR", "اطلاعات محصول کامل یا معتبر نیست.");
  }
  return { title, slug, description, priceMinor: input.priceMinor, discountPercent: input.discountPercent, currency };
}

function normalizeGroupSessions(input: AdminGroupTherapyInput) {
  const sessionCount = input.durationSessions;
  if (!Number.isInteger(sessionCount) || !sessionCount || sessionCount < 1) {
    throw new AdminServiceError("VALIDATION_ERROR", "تعداد جلسات گروه‌درمانی را وارد کنید.");
  }
  if (input.sessions.length !== sessionCount) {
    throw new AdminServiceError("VALIDATION_ERROR", "تعداد ردیف‌های جلسه با تعداد جلسات یکسان نیست.");
  }
  const sessions = input.sessions.map((session) => ({ title: session.title.trim(), startsAt: session.startsAt }));
  const incompleteIndex = sessions.findIndex((session) => !session.title || Number.isNaN(session.startsAt.getTime()));
  if (incompleteIndex !== -1) {
    throw new AdminServiceError("VALIDATION_ERROR", `عنوان و زمان جلسه ${incompleteIndex + 1} را کامل کنید.`);
  }
  return sessions;
}

type RawPrismaClient = Pick<typeof prisma, "$executeRaw">;

type DiscountRow = { discountPercent: number | null };

async function getProductDiscount(productId: string) {
  const rows = await prisma.$queryRaw<DiscountRow[]>`
    SELECT "discountPercent"
    FROM "Product"
    WHERE "id" = ${productId}
  `;
  return rows[0]?.discountPercent ?? 0;
}

async function persistProductDiscount(client: RawPrismaClient, productId: string, discountPercent: number) {
  await client.$executeRaw`
    UPDATE "Product"
    SET "discountPercent" = ${discountPercent}, "updatedAt" = CURRENT_TIMESTAMP
    WHERE "id" = ${productId}
  `;
}

async function persistGroupTherapyDetails(
  client: RawPrismaClient,
  productId: string,
  instructorName: string | null,
  durationSessions: number,
  sessions: Array<{ title: string; startsAt: Date }>,
) {
  // Keep this write on SQL rather than the generated relation delegate. A
  // running dev server can temporarily hold an older Prisma data model after
  // a schema change, while the database itself already has these columns.
  await client.$executeRaw`
    INSERT INTO "GroupTherapyProduct" ("productId", "instructorName", "durationSessions")
    VALUES (${productId}, ${instructorName}, ${durationSessions})
    ON CONFLICT ("productId") DO UPDATE SET
      "instructorName" = EXCLUDED."instructorName",
      "durationSessions" = EXCLUDED."durationSessions"
  `;

  await client.$executeRaw`
    DELETE FROM "GroupTherapySession"
    WHERE "groupTherapyProductId" = ${productId}
  `;

  for (const [index, session] of sessions.entries()) {
    await client.$executeRaw`
      INSERT INTO "GroupTherapySession"
        ("id", "groupTherapyProductId", "title", "startsAt", "order", "createdAt", "updatedAt")
      VALUES
        (${randomUUID()}, ${productId}, ${session.title}, ${session.startsAt}, ${index}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;
  }
}

async function ensureUniqueSlug(slug: string, productId?: string) {
  const existing = await prisma.product.findFirst({ where: { slug, ...(productId ? { NOT: { id: productId } } : {}) }, select: { id: true } });
  if (existing) throw new AdminServiceError("CONFLICT", "این اسلاگ قبلاً استفاده شده است.");
}

async function ensureCoverMedia(coverMediaId?: string | null) {
  if (!coverMediaId) return;
  const media = await prisma.mediaAsset.findFirst({ where: { id: coverMediaId, status: "ACTIVE", visibility: "PUBLIC" }, select: { id: true } });
  if (!media) throw new AdminServiceError("VALIDATION_ERROR", "تصویر کاور معتبر یا عمومی نیست.");
}

async function ensureManagedProduct(productId: string, section: ManagedSection) {
  const product = await prisma.product.findFirst({ where: { id: productId, kind: kindBySection[section] }, select: { id: true, title: true, slug: true, status: true, kind: true } });
  if (!product) throw new AdminServiceError("NOT_FOUND", section === "group" ? "گروه‌درمانی پیدا نشد." : "مشاوره فردی پیدا نشد.");
  return product;
}

export async function listAdminTherapyProducts(section: ManagedSection, query: AdminListQuery, status?: ProductStatus) {
  const where = {
    kind: kindBySection[section],
    ...(status ? { status } : {}),
    ...(query.search ? { OR: [{ title: { contains: query.search, mode: "insensitive" as const } }, { slug: { contains: query.search, mode: "insensitive" as const } }] } : {}),
  };
  const orderBy = query.sort === "title" ? { title: query.direction } : query.sort === "status" ? { status: query.direction } : { createdAt: query.direction };
  const [total, rows] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({ where, orderBy, skip: paginationOffset(query), take: query.pageSize, select: managedSelect }),
  ]);
  return { rows, meta: pageMeta(total, query) };
}

export async function getAdminTherapyProduct(section: ManagedSection, productId: string) {
  const product = await prisma.product.findFirst({ where: { id: productId, kind: kindBySection[section] }, select: managedSelect });
  if (!product) throw new AdminServiceError("NOT_FOUND", section === "group" ? "گروه‌درمانی پیدا نشد." : "مشاوره فردی پیدا نشد.");
  const productWithDiscount = { ...product, discountPercent: await getProductDiscount(productId) };
  if (section !== "group" || !product.groupTherapy) return productWithDiscount;
  return { ...productWithDiscount, groupTherapy: { ...product.groupTherapy, ...await getGroupTherapyDetails(productId) } };
}

export async function createAdminGroupTherapy(actorId: string, input: AdminGroupTherapyInput) {
  const base = normalizeBase(input);
  const { discountPercent, ...productBase } = base;
  const sessions = normalizeGroupSessions(input);
  await ensureUniqueSlug(base.slug);
  await ensureCoverMedia(input.coverMediaId);
  const created = await prisma.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        ...productBase,
        kind: ProductKind.GROUP,
        coverMediaId: input.coverMediaId || null,
      },
      select: { id: true, slug: true, title: true, status: true },
    });
    await persistProductDiscount(tx, product.id, discountPercent);
    await persistGroupTherapyDetails(tx, product.id, input.instructorName?.trim() || null, sessions.length, sessions);
    await recordAdminAuditWithClient(tx, { actorId, action: "GROUP_THERAPY_CREATED", targetType: "GROUP_THERAPY", targetId: product.id, afterState: product });
    return product;
  });
  return created;
}

export async function updateAdminGroupTherapy(actorId: string, productId: string, input: AdminGroupTherapyInput) {
  await ensureManagedProduct(productId, "group");
  const base = normalizeBase(input);
  const { discountPercent, ...productBase } = base;
  await ensureUniqueSlug(base.slug, productId);
  await ensureCoverMedia(input.coverMediaId);
  const sessions = normalizeGroupSessions(input);
  return prisma.$transaction(async (tx) => {
    const before = await tx.product.findUnique({ where: { id: productId }, select: { title: true, slug: true, description: true, priceMinor: true, currency: true, coverMediaId: true, status: true, groupTherapy: { select: { productId: true } } } });
    if (!before?.groupTherapy) throw new AdminServiceError("NOT_FOUND", "گروه‌درمانی پیدا نشد.");
    const updated = await tx.product.update({
      where: { id: productId },
      data: {
        ...productBase,
        coverMediaId: input.coverMediaId || null,
      },
      select: { id: true, slug: true, title: true, status: true },
    });
    await persistProductDiscount(tx, productId, discountPercent);
    await persistGroupTherapyDetails(tx, productId, input.instructorName?.trim() || null, sessions.length, sessions);
    await recordAdminAuditWithClient(tx, { actorId, action: "GROUP_THERAPY_UPDATED", targetType: "GROUP_THERAPY", targetId: productId, beforeState: before, afterState: updated });
    return updated;
  });
}

export async function createAdminIndividualConsultation(actorId: string, input: AdminIndividualConsultationInput) {
  const base = normalizeBase(input);
  const { discountPercent, ...productBase } = base;
  await ensureUniqueSlug(base.slug);
  const created = await prisma.$transaction(async (tx) => {
    const product = await tx.product.create({ data: { ...productBase, kind: ProductKind.CONSULTATION, consultation: { create: { durationMinutes: input.durationMinutes } }, sessionPackage: { create: { includedSessions: input.includedSessions } } }, select: { id: true, slug: true, title: true, status: true } });
    await persistProductDiscount(tx, product.id, discountPercent);
    await recordAdminAuditWithClient(tx, { actorId, action: "INDIVIDUAL_CONSULTATION_CREATED", targetType: "INDIVIDUAL_CONSULTATION", targetId: product.id, afterState: product });
    return product;
  });
  return created;
}

export async function updateAdminIndividualConsultation(actorId: string, productId: string, input: AdminIndividualConsultationInput) {
  await ensureManagedProduct(productId, "consultation");
  const base = normalizeBase(input);
  const { discountPercent, ...productBase } = base;
  await ensureUniqueSlug(base.slug, productId);
  return prisma.$transaction(async (tx) => {
    const before = await tx.product.findUnique({ where: { id: productId }, select: { title: true, slug: true, description: true, priceMinor: true, currency: true, status: true, consultation: { select: { durationMinutes: true } }, sessionPackage: { select: { includedSessions: true } } } });
    if (!before?.consultation) throw new AdminServiceError("NOT_FOUND", "مشاوره فردی پیدا نشد.");
    const updated = await tx.product.update({ where: { id: productId }, data: { ...productBase, consultation: { update: { durationMinutes: input.durationMinutes } }, sessionPackage: { upsert: { update: { includedSessions: input.includedSessions }, create: { includedSessions: input.includedSessions } } } }, select: { id: true, slug: true, title: true, status: true } });
    await persistProductDiscount(tx, productId, discountPercent);
    await recordAdminAuditWithClient(tx, { actorId, action: "INDIVIDUAL_CONSULTATION_UPDATED", targetType: "INDIVIDUAL_CONSULTATION", targetId: productId, beforeState: before, afterState: updated });
    return updated;
  });
}

export async function setAdminTherapyProductStatus(actorId: string, section: ManagedSection, productId: string, status: ProductStatus, reason: string) {
  const trimmedReason = reason.trim();
  if (!trimmedReason) throw new AdminServiceError("VALIDATION_ERROR", "دلیل تغییر وضعیت را وارد کنید.");
  const current = await ensureManagedProduct(productId, section);
  if (current.status === status) throw new AdminServiceError("CONFLICT", "محصول از قبل همین وضعیت را دارد.");
  return prisma.$transaction(async (tx) => {
    const updated = await tx.product.update({ where: { id: productId }, data: { status }, select: { id: true, status: true, title: true } });
    await recordAdminAuditWithClient(tx, { actorId, action: `${section === "group" ? "GROUP_THERAPY" : "INDIVIDUAL_CONSULTATION"}_STATUS_CHANGED`, targetType: section === "group" ? "GROUP_THERAPY" : "INDIVIDUAL_CONSULTATION", targetId: productId, beforeState: { status: current.status }, afterState: updated, reason: trimmedReason });
    return updated;
  });
}

export async function deleteAdminTherapyProduct(actorId: string, section: ManagedSection, productId: string) {
  const current = await ensureManagedProduct(productId, section);
  return prisma.$transaction(async (tx) => {
    const [orders, purchases, entitlements, appointments, reviews] = await Promise.all([
      tx.order.count({ where: { productId } }),
      tx.purchase.count({ where: { productId } }),
      tx.entitlement.count({ where: { productId } }),
      tx.appointment.count({ where: { productId } }),
      tx.review.count({ where: { productId } }),
    ]);
    if (orders || purchases || entitlements || appointments || reviews) throw new AdminServiceError("CONFLICT", "این محصول سابقه خرید، جلسه یا نظر دارد و حذف کامل آن ممکن نیست؛ آن را مخفی کنید.");
    const deleted = await tx.product.delete({ where: { id: productId }, select: { id: true, title: true, slug: true } });
    await recordAdminAuditWithClient(tx, { actorId, action: `${section === "group" ? "GROUP_THERAPY" : "INDIVIDUAL_CONSULTATION"}_DELETED`, targetType: section === "group" ? "GROUP_THERAPY" : "INDIVIDUAL_CONSULTATION", targetId: productId, beforeState: current, afterState: deleted });
    return deleted;
  });
}
