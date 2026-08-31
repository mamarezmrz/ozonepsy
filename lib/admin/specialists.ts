import { SpecialistStatus } from "@/lib/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { AdminServiceError } from "@/lib/admin/errors";
import { recordAdminAuditWithClient } from "@/lib/admin/audit";
import { pageMeta, paginationOffset, type AdminListQuery } from "@/lib/admin/query";
import type { AdminSessionView } from "@/lib/admin/session";

function scopedWhere(session?: AdminSessionView) {
  return session?.roles.length === 1 && session.roles[0] === "INSTRUCTOR" ? { userId: session.userId } : {};
}

export async function listAdminSpecialists(query: AdminListQuery, status?: SpecialistStatus, session?: AdminSessionView) {
  const where = {
    ...scopedWhere(session),
    ...(status ? { status } : {}),
    ...(query.search ? { OR: [
      { displayName: { contains: query.search, mode: "insensitive" as const } },
      { slug: { contains: query.search, mode: "insensitive" as const } },
      { specialty: { contains: query.search, mode: "insensitive" as const } },
    ] } : {}),
  };
  const orderBy = query.sort === "displayName" ? { displayName: query.direction } : query.sort === "status" ? { status: query.direction } : { createdAt: query.direction };
  const [total, rows] = await Promise.all([
    prisma.specialist.count({ where }),
    prisma.specialist.findMany({
      where,
      orderBy,
      skip: paginationOffset(query),
      take: query.pageSize,
      select: { id: true, slug: true, displayName: true, specialty: true, status: true, imageUrl: true, userId: true, createdAt: true, _count: { select: { appointments: true, courseAssignments: true } } },
    }),
  ]);
  return { rows: rows.map((row) => ({ ...row, appointmentCount: row._count.appointments, courseCount: row._count.courseAssignments })), meta: pageMeta(total, query) };
}

export async function getAdminSpecialist(id: string, session?: AdminSessionView) {
  const row = await prisma.specialist.findFirst({
    where: { id, ...scopedWhere(session) },
    select: {
      id: true, slug: true, displayName: true, specialty: true, bio: true, imageUrl: true, status: true, userId: true, createdAt: true, updatedAt: true,
      user: { select: { id: true, email: true, profile: { select: { displayName: true, firstName: true, lastName: true } } } },
      courseAssignments: { select: { courseProductId: true, courseProduct: { select: { product: { select: { id: true, title: true, slug: true, status: true } } } } } },
      _count: { select: { appointments: true } },
    },
  });
  if (!row) throw new AdminServiceError("NOT_FOUND", "متخصص پیدا نشد.");
  return row;
}

export async function createAdminSpecialist(actorId: string, input: { slug: string; displayName: string; specialty?: string; bio?: string; imageUrl?: string | null; userId?: string | null }) {
  const data = { slug: input.slug.trim().toLowerCase(), displayName: input.displayName.trim(), specialty: input.specialty?.trim() || null, bio: input.bio?.trim() || null, imageUrl: input.imageUrl?.trim() || null, userId: input.userId || null };
  if (!data.slug || !data.displayName) throw new AdminServiceError("VALIDATION_ERROR", "اطلاعات متخصص کامل نیست.");
  return prisma.$transaction(async (tx) => {
    if (data.userId) {
      const user = await tx.user.findUnique({ where: { id: data.userId }, select: { id: true } });
      if (!user) throw new AdminServiceError("NOT_FOUND", "کاربر مربوط به متخصص پیدا نشد.");
    }
    const created = await tx.specialist.create({ data, select: { id: true, slug: true, displayName: true, status: true } });
    await recordAdminAuditWithClient(tx, { actorId, action: "SPECIALIST_CREATED", targetType: "SPECIALIST", targetId: created.id, afterState: created });
    return created;
  });
}

export async function updateAdminSpecialist(actorId: string, id: string, input: { slug: string; displayName: string; specialty?: string; bio?: string; imageUrl?: string | null; userId?: string | null }) {
  const before = await prisma.specialist.findUnique({ where: { id }, select: { id: true } });
  if (!before) throw new AdminServiceError("NOT_FOUND", "متخصص پیدا نشد.");
  const data = { slug: input.slug.trim().toLowerCase(), displayName: input.displayName.trim(), specialty: input.specialty?.trim() || null, bio: input.bio?.trim() || null, imageUrl: input.imageUrl?.trim() || null, userId: input.userId || null };
  if (!data.slug || !data.displayName) throw new AdminServiceError("VALIDATION_ERROR", "اطلاعات متخصص کامل نیست.");
  return prisma.$transaction(async (tx) => {
    if (data.userId) {
      const user = await tx.user.findUnique({ where: { id: data.userId }, select: { id: true } });
      if (!user) throw new AdminServiceError("NOT_FOUND", "کاربر مربوط به متخصص پیدا نشد.");
    }
    const updated = await tx.specialist.update({ where: { id }, data, select: { id: true, slug: true, displayName: true, specialty: true, bio: true, imageUrl: true, userId: true, status: true } });
    await recordAdminAuditWithClient(tx, { actorId, action: "SPECIALIST_UPDATED", targetType: "SPECIALIST", targetId: id, beforeState: before, afterState: updated });
    return updated;
  });
}

export async function setAdminSpecialistStatus(actorId: string, id: string, status: SpecialistStatus, reason: string) {
  const trimmedReason = reason.trim();
  if (!trimmedReason) throw new AdminServiceError("VALIDATION_ERROR", "دلیل تغییر وضعیت متخصص را وارد کنید.");
  return prisma.$transaction(async (tx) => {
    const before = await tx.specialist.findUnique({ where: { id }, select: { id: true, status: true } });
    if (!before) throw new AdminServiceError("NOT_FOUND", "متخصص پیدا نشد.");
    if (before.status === status) throw new AdminServiceError("CONFLICT", "متخصص از قبل همین وضعیت را دارد.");
    const updated = await tx.specialist.update({ where: { id }, data: { status }, select: { id: true, status: true } });
    await recordAdminAuditWithClient(tx, { actorId, action: status === SpecialistStatus.ACTIVE ? "SPECIALIST_ACTIVATED" : "SPECIALIST_DEACTIVATED", targetType: "SPECIALIST", targetId: id, beforeState: before, afterState: updated, reason: trimmedReason });
    return updated;
  });
}

export async function assignAdminSpecialistCourses(actorId: string, id: string, courseIds: string[]) {
  return prisma.$transaction(async (tx) => {
    const specialist = await tx.specialist.findUnique({ where: { id }, select: { id: true } });
    if (!specialist) throw new AdminServiceError("NOT_FOUND", "متخصص پیدا نشد.");
    const courses = await tx.courseProduct.findMany({ where: { productId: { in: courseIds } }, select: { productId: true } });
    if (courses.length !== new Set(courseIds).size) throw new AdminServiceError("VALIDATION_ERROR", "یکی از دوره‌های انتخاب‌شده معتبر نیست.");
    await tx.courseSpecialist.deleteMany({ where: { specialistId: id } });
    if (courseIds.length) await tx.courseSpecialist.createMany({ data: courseIds.map((courseProductId) => ({ specialistId: id, courseProductId })), skipDuplicates: true });
    await recordAdminAuditWithClient(tx, { actorId, action: "SPECIALIST_COURSES_ASSIGNED", targetType: "SPECIALIST", targetId: id, afterState: { courseIds } });
    return { courseIds };
  });
}
