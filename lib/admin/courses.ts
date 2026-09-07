import { CourseDeliveryMode, ProductKind, ProductStatus } from "@/lib/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { AdminServiceError } from "@/lib/admin/errors";
import { recordAdminAuditWithClient } from "@/lib/admin/audit";
import { pageMeta, paginationOffset, type AdminListQuery } from "@/lib/admin/query";
import type { AdminSessionView } from "@/lib/admin/session";

const courseWhere = { kind: ProductKind.COURSE } as const;

function courseScope(session?: AdminSessionView) {
  return session?.roles.includes("INSTRUCTOR") && !session.roles.some((role) => role === "ADMIN" || role === "SUPER_ADMIN")
    ? { course: { is: { instructors: { some: { specialist: { userId: session.userId } } } } } }
    : {};
}

async function ensureCourse(productId: string, session?: AdminSessionView) {
  const course = await prisma.product.findFirst({ where: { id: productId, ...courseWhere, ...courseScope(session) }, select: { id: true, title: true, slug: true, status: true, course: { select: { productId: true } } } });
  if (!course?.course) throw new AdminServiceError("NOT_FOUND", "دوره پیدا نشد.");
  return course;
}

function productData(input: { title: string; slug: string; description: string; priceMinor: number; currency: string; categoryId?: string | null; deliveryMode: CourseDeliveryMode; accessDays?: number | null }) {
  return {
    title: input.title.trim(), slug: input.slug.trim().toLowerCase(), description: input.description.trim(), priceMinor: input.priceMinor, currency: input.currency.trim().toUpperCase().slice(0, 3), categoryId: input.categoryId || null,
    kind: ProductKind.COURSE, deliveryMode: input.deliveryMode, accessDays: input.accessDays ?? null,
  };
}

export type AdminCourseCreateInput = {
  title: string;
  slug: string;
  description: string;
  priceMinor: number;
  currency: string;
  categoryId?: string | null;
  deliveryMode: CourseDeliveryMode;
  accessDays?: number | null;
  coverMediaId?: string | null;
  coverImageMode?: "BRANDED" | "PLAIN";
  categorySlugs?: string[];
  instructorName?: string;
  durationSessions?: number | null;
  demoMediaId?: string | null;
  demoVideoDuration?: number | null;
  sessions?: Array<{ title: string; videoMediaId?: string | null; videoDuration?: number | null }>;
};

export async function listAdminCourses(query: AdminListQuery, status?: ProductStatus, session?: AdminSessionView) {
  const where = { ...courseWhere, ...courseScope(session), ...(status ? { status } : {}), ...(query.search ? { OR: [{ title: { contains: query.search, mode: "insensitive" as const } }, { slug: { contains: query.search, mode: "insensitive" as const } }] } : {}) };
  const orderBy = query.sort === "title" ? { title: query.direction } : query.sort === "status" ? { status: query.direction } : { createdAt: query.direction };
  const [total, courses] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({ where, orderBy, skip: paginationOffset(query), take: query.pageSize, select: { id: true, slug: true, title: true, description: true, priceMinor: true, currency: true, status: true, createdAt: true, category: { select: { title: true } }, course: { select: { deliveryMode: true, accessDays: true, _count: { select: { modules: true, enrollments: true } } } } } }),
  ]);
  return { rows: courses.map((course) => ({ ...course, moduleCount: course.course?._count.modules ?? 0, enrollmentCount: course.course?._count.enrollments ?? 0 })), meta: pageMeta(total, query) };
}

export async function listAdminCourseOptions(session?: AdminSessionView) {
  return prisma.product.findMany({
    where: { ...courseWhere, ...courseScope(session) },
    orderBy: { title: "asc" },
    select: { id: true, title: true, slug: true, status: true },
  });
}

export async function getAdminCourse(productId: string, session?: AdminSessionView) {
  const course = await prisma.product.findFirst({
    where: { id: productId, ...courseWhere, ...courseScope(session) },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      priceMinor: true,
      currency: true,
      status: true,
      categoryId: true,
      coverMediaId: true,
      category: { select: { title: true, slug: true } },
      course: {
        select: {
          deliveryMode: true,
          accessDays: true,
          curriculum: true,
          modules: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              title: true,
              description: true,
              order: true,
              status: true,
              lessons: {
                orderBy: { order: "asc" },
                select: {
                  id: true,
                  title: true,
                  description: true,
                  order: true,
                  duration: true,
                  status: true,
                  isPreview: true,
                  mediaId: true,
                  media: { select: { originalName: true } },
                },
              },
            },
          },
          instructors: { select: { specialist: { select: { id: true, displayName: true, status: true } } } },
        },
      },
    },
  });
  if (!course?.course) throw new AdminServiceError("NOT_FOUND", "دوره پیدا نشد.");
  return { ...course, course: course.course };
}

export async function createAdminCourse(actorId: string, input: AdminCourseCreateInput) {
  const data = productData(input);
  if (!data.title || !data.slug || !data.description || data.priceMinor < 0) throw new AdminServiceError("VALIDATION_ERROR", "اطلاعات دوره کامل یا معتبر نیست.");
  const sessions = (input.sessions ?? []).map((session) => ({ title: session.title.trim(), videoMediaId: session.videoMediaId ?? null, videoDuration: session.videoDuration ?? null })).filter((session) => session.title);
  const curriculum = {
    coverImageMode: input.coverImageMode ?? "BRANDED",
    categorySlugs: (input.categorySlugs ?? []).map((slug) => slug.trim()).filter(Boolean),
    instructorName: input.instructorName?.trim() || null,
    durationSessions: input.durationSessions ?? null,
    demoMediaId: input.demoMediaId ?? null,
    demoVideoDuration: input.demoVideoDuration ?? null,
    sessions: sessions.map((session, index) => ({ order: index, title: session.title, videoMediaId: session.videoMediaId, videoDuration: session.videoDuration })),
  };
  return prisma.$transaction(async (tx) => {
    if (input.coverMediaId) {
      const media = await tx.mediaAsset.findFirst({ where: { id: input.coverMediaId, status: "ACTIVE" }, select: { id: true } });
      if (!media) throw new AdminServiceError("VALIDATION_ERROR", "تصویر کاور معتبر نیست.");
    }
    const mediaIds = [...new Set([input.demoMediaId, ...sessions.map((session) => session.videoMediaId)].filter((id): id is string => Boolean(id)))];
    if (mediaIds.length) {
      const activeMedia = await tx.mediaAsset.findMany({ where: { id: { in: mediaIds }, status: "ACTIVE" }, select: { id: true } });
      if (activeMedia.length !== mediaIds.length) throw new AdminServiceError("VALIDATION_ERROR", "یکی از فایل‌های ویدئویی معتبر نیست.");
    }
    const created = await tx.product.create({
      data: {
        title: data.title,
        slug: data.slug,
        description: data.description,
        priceMinor: data.priceMinor,
        currency: data.currency,
        categoryId: data.categoryId,
        coverMediaId: input.coverMediaId || null,
        kind: ProductKind.COURSE,
        course: {
          create: {
            deliveryMode: data.deliveryMode,
            accessDays: data.accessDays,
            curriculum,
            ...(sessions.length ? {
              modules: {
                create: [{
                  title: "جلسات دوره",
                  order: 0,
                  lessons: { create: sessions.map((session, index) => ({ title: session.title, order: index, duration: session.videoDuration, mediaId: session.videoMediaId })) },
                }],
              },
            } : {}),
          },
        },
      },
      select: { id: true, slug: true, title: true, status: true },
    });
    await recordAdminAuditWithClient(tx, { actorId, action: "COURSE_CREATED", targetType: "COURSE", targetId: created.id, afterState: created });
    return created;
  });
}

export async function updateAdminCourse(actorId: string, productId: string, input: AdminCourseCreateInput, session?: AdminSessionView) {
  await ensureCourse(productId, session);
  const data = productData(input);
  if (!data.title || !data.slug || !data.description || data.priceMinor < 0) throw new AdminServiceError("VALIDATION_ERROR", "اطلاعات دوره کامل یا معتبر نیست.");
  const sessions = (input.sessions ?? []).map((courseSession) => ({ title: courseSession.title.trim(), videoMediaId: courseSession.videoMediaId ?? null, videoDuration: courseSession.videoDuration ?? null })).filter((courseSession) => courseSession.title);
  const curriculum = {
    coverImageMode: input.coverImageMode ?? "BRANDED",
    categorySlugs: (input.categorySlugs ?? []).map((slug) => slug.trim()).filter(Boolean),
    instructorName: input.instructorName?.trim() || null,
    durationSessions: input.durationSessions ?? null,
    demoMediaId: input.demoMediaId ?? null,
    demoVideoDuration: input.demoVideoDuration ?? null,
    sessions: sessions.map((courseSession, index) => ({ order: index, title: courseSession.title, videoMediaId: courseSession.videoMediaId, videoDuration: courseSession.videoDuration })),
  };
  return prisma.$transaction(async (tx) => {
    if (input.coverMediaId) {
      const media = await tx.mediaAsset.findFirst({ where: { id: input.coverMediaId, status: "ACTIVE" }, select: { id: true } });
      if (!media) throw new AdminServiceError("VALIDATION_ERROR", "تصویر کاور معتبر نیست.");
    }
    const mediaIds = [...new Set([input.demoMediaId, ...sessions.map((courseSession) => courseSession.videoMediaId)].filter((id): id is string => Boolean(id)))];
    if (mediaIds.length) {
      const activeMedia = await tx.mediaAsset.findMany({ where: { id: { in: mediaIds }, status: "ACTIVE" }, select: { id: true } });
      if (activeMedia.length !== mediaIds.length) throw new AdminServiceError("VALIDATION_ERROR", "یکی از فایل‌های ویدئویی معتبر نیست.");
    }
    const before = await tx.product.findUnique({ where: { id: productId }, select: { title: true, slug: true, description: true, priceMinor: true, currency: true, categoryId: true, coverMediaId: true, status: true, course: { select: { deliveryMode: true, accessDays: true, curriculum: true } } } });
    if (!before) throw new AdminServiceError("NOT_FOUND", "دوره پیدا نشد.");
    const updated = await tx.product.update({ where: { id: productId }, data: { title: data.title, slug: data.slug, description: data.description, priceMinor: data.priceMinor, currency: data.currency, categoryId: data.categoryId, coverMediaId: input.coverMediaId || null, course: { update: { deliveryMode: data.deliveryMode, accessDays: data.accessDays ?? before.course?.accessDays ?? null, curriculum } } }, select: { id: true, slug: true, title: true, status: true } });
    await tx.courseModule.deleteMany({ where: { courseProductId: productId } });
    if (sessions.length) {
      await tx.courseModule.create({ data: { courseProductId: productId, title: "جلسات دوره", order: 0, status: before.status === ProductStatus.PUBLISHED ? ProductStatus.PUBLISHED : ProductStatus.DRAFT, lessons: { create: sessions.map((courseSession, index) => ({ title: courseSession.title, order: index, duration: courseSession.videoDuration, mediaId: courseSession.videoMediaId, status: before.status === ProductStatus.PUBLISHED ? ProductStatus.PUBLISHED : ProductStatus.DRAFT })) } } });
    }
    await recordAdminAuditWithClient(tx, { actorId, action: "COURSE_UPDATED", targetType: "COURSE", targetId: productId, beforeState: before, afterState: updated });
    return updated;
  });
}

export async function setAdminCourseStatus(actorId: string, productId: string, status: ProductStatus, reason: string, session?: AdminSessionView) {
  const trimmedReason = reason.trim();
  if (!trimmedReason) throw new AdminServiceError("VALIDATION_ERROR", "دلیل تغییر وضعیت دوره را وارد کنید.");
  await ensureCourse(productId, session);
  return prisma.$transaction(async (tx) => {
    const before = await tx.product.findFirst({ where: { id: productId, ...courseWhere, ...courseScope(session) }, select: { id: true, status: true } });
    if (!before) throw new AdminServiceError("NOT_FOUND", "دوره پیدا نشد.");
    if (before.status === status) throw new AdminServiceError("CONFLICT", "دوره از قبل همین وضعیت را دارد.");
    const updated = await tx.product.update({ where: { id: productId }, data: { status }, select: { id: true, status: true } });
    if (status === ProductStatus.PUBLISHED) {
      const modules = await tx.courseModule.findMany({ where: { courseProductId: productId }, select: { id: true } });
      await tx.courseModule.updateMany({ where: { courseProductId: productId }, data: { status: ProductStatus.PUBLISHED } });
      if (modules.length) await tx.courseLesson.updateMany({ where: { moduleId: { in: modules.map((module) => module.id) } }, data: { status: ProductStatus.PUBLISHED } });
    }
    await recordAdminAuditWithClient(tx, { actorId, action: status === ProductStatus.PUBLISHED ? "COURSE_PUBLISHED" : status === ProductStatus.ARCHIVED ? "COURSE_ARCHIVED" : "COURSE_UNPUBLISHED", targetType: "COURSE", targetId: productId, beforeState: before, afterState: updated, reason: trimmedReason });
    return updated;
  });
}

export async function deleteAdminCourse(actorId: string, productId: string, session?: AdminSessionView) {
  await ensureCourse(productId, session);
  return prisma.$transaction(async (tx) => {
    const [orders, purchases, entitlements, enrollments, appointments, reviews] = await Promise.all([
      tx.order.count({ where: { productId } }),
      tx.purchase.count({ where: { productId } }),
      tx.entitlement.count({ where: { productId } }),
      tx.enrollment.count({ where: { courseProductId: productId } }),
      tx.appointment.count({ where: { productId } }),
      tx.review.count({ where: { productId } }),
    ]);
    if (orders || purchases || entitlements || enrollments || appointments || reviews) throw new AdminServiceError("CONFLICT", "این دوره سابقه خرید، ثبت‌نام، جلسه یا نظر دارد و حذف کامل آن ممکن نیست؛ آن را مخفی کنید.");
    const deleted = await tx.product.delete({ where: { id: productId }, select: { id: true, title: true, slug: true } });
    await recordAdminAuditWithClient(tx, { actorId, action: "COURSE_DELETED", targetType: "COURSE", targetId: productId, beforeState: deleted });
    return deleted;
  });
}

export async function duplicateAdminCourse(actorId: string, productId: string, session?: AdminSessionView) {
  const source = await getAdminCourse(productId, session);
  const slug = `${source.slug}-copy-${Date.now().toString(36)}`.slice(0, 160);
  return prisma.$transaction(async (tx) => {
    const created = await tx.product.create({ data: { title: `${source.title} - کپی`, slug, description: source.description, priceMinor: source.priceMinor, currency: source.currency, categoryId: source.categoryId, kind: ProductKind.COURSE, status: ProductStatus.DRAFT, course: { create: { deliveryMode: source.course.deliveryMode, accessDays: source.course.accessDays, curriculum: source.course.curriculum ?? undefined } } }, select: { id: true, slug: true, title: true, status: true } });
    for (const courseModule of source.course.modules) {
      await tx.courseModule.create({
        data: {
          courseProductId: created.id,
          title: courseModule.title,
          description: courseModule.description,
          order: courseModule.order,
          status: ProductStatus.DRAFT,
          lessons: {
            create: courseModule.lessons.map((lesson) => ({
              title: lesson.title,
              description: lesson.description,
              order: lesson.order,
              duration: lesson.duration,
              status: ProductStatus.DRAFT,
              isPreview: lesson.isPreview,
              mediaId: lesson.mediaId,
            })),
          },
        },
      });
    }
    await recordAdminAuditWithClient(tx, { actorId, action: "COURSE_DUPLICATED", targetType: "COURSE", targetId: created.id, afterState: { sourceId: productId, course: created } });
    return created;
  });
}

async function ensureModule(moduleId: string, session?: AdminSessionView) {
  const courseModule = await prisma.courseModule.findUnique({ where: { id: moduleId }, select: { id: true, courseProductId: true, title: true, order: true } });
  if (!courseModule) throw new AdminServiceError("NOT_FOUND", "ماژول پیدا نشد.");
  await ensureCourse(courseModule.courseProductId, session);
  return courseModule;
}

export async function createAdminModule(actorId: string, courseId: string, title: string, description?: string, session?: AdminSessionView) {
  await ensureCourse(courseId, session);
  const trimmedTitle = title.trim();
  if (!trimmedTitle) throw new AdminServiceError("VALIDATION_ERROR", "عنوان ماژول را وارد کنید.");
  return prisma.$transaction(async (tx) => {
    const last = await tx.courseModule.findFirst({ where: { courseProductId: courseId }, orderBy: { order: "desc" }, select: { order: true } });
    const created = await tx.courseModule.create({ data: { courseProductId: courseId, title: trimmedTitle, description: description?.trim() || null, order: (last?.order ?? -1) + 1 }, select: { id: true, title: true, order: true, status: true } });
    await recordAdminAuditWithClient(tx, { actorId, action: "COURSE_MODULE_CREATED", targetType: "COURSE_MODULE", targetId: created.id, afterState: created });
    return created;
  });
}

export async function updateAdminModule(actorId: string, moduleId: string, title: string, description?: string, session?: AdminSessionView) {
  await ensureModule(moduleId, session);
  if (!title.trim()) throw new AdminServiceError("VALIDATION_ERROR", "عنوان ماژول را وارد کنید.");
  return prisma.$transaction(async (tx) => {
    const before = await tx.courseModule.findUnique({ where: { id: moduleId }, select: { title: true, description: true } });
    const updated = await tx.courseModule.update({ where: { id: moduleId }, data: { title: title.trim(), description: description?.trim() || null }, select: { id: true, title: true, description: true } });
    await recordAdminAuditWithClient(tx, { actorId, action: "COURSE_MODULE_UPDATED", targetType: "COURSE_MODULE", targetId: moduleId, beforeState: before, afterState: updated });
    return updated;
  });
}

export async function setAdminModuleStatus(actorId: string, moduleId: string, status: ProductStatus, reason: string, session?: AdminSessionView) {
  await ensureModule(moduleId, session);
  if (!reason.trim()) throw new AdminServiceError("VALIDATION_ERROR", "دلیل تغییر وضعیت ماژول را وارد کنید.");
  return prisma.$transaction(async (tx) => {
    const before = await tx.courseModule.findUnique({ where: { id: moduleId }, select: { status: true } });
    const updated = await tx.courseModule.update({ where: { id: moduleId }, data: { status }, select: { id: true, status: true } });
    await recordAdminAuditWithClient(tx, { actorId, action: "COURSE_MODULE_STATUS_CHANGED", targetType: "COURSE_MODULE", targetId: moduleId, beforeState: before, afterState: updated, reason: reason.trim() });
    return updated;
  });
}

export async function reorderAdminModules(actorId: string, courseId: string, moduleIds: string[], session?: AdminSessionView) {
  await ensureCourse(courseId, session);
  return prisma.$transaction(async (tx) => {
    const modules = await tx.courseModule.findMany({ where: { courseProductId: courseId }, select: { id: true } });
    if (modules.length !== moduleIds.length || modules.some(({ id }) => !moduleIds.includes(id))) throw new AdminServiceError("VALIDATION_ERROR", "ترتیب ماژول‌ها معتبر نیست.");
    for (let index = 0; index < moduleIds.length; index += 1) await tx.courseModule.update({ where: { id: moduleIds[index] }, data: { order: -(index + 1) } });
    for (let index = 0; index < moduleIds.length; index += 1) await tx.courseModule.update({ where: { id: moduleIds[index] }, data: { order: index } });
    await recordAdminAuditWithClient(tx, { actorId, action: "COURSE_MODULES_REORDERED", targetType: "COURSE", targetId: courseId, afterState: { moduleIds } });
    return { moduleIds };
  });
}

export async function createAdminLesson(actorId: string, moduleId: string, input: { title: string; description?: string; duration?: number | null; isPreview?: boolean }, session?: AdminSessionView) {
  await ensureModule(moduleId, session);
  if (!input.title.trim()) throw new AdminServiceError("VALIDATION_ERROR", "عنوان جلسه را وارد کنید.");
  return prisma.$transaction(async (tx) => {
    const last = await tx.courseLesson.findFirst({ where: { moduleId }, orderBy: { order: "desc" }, select: { order: true } });
    const created = await tx.courseLesson.create({ data: { moduleId, title: input.title.trim(), description: input.description?.trim() || null, duration: input.duration ?? null, isPreview: input.isPreview ?? false, order: (last?.order ?? -1) + 1 }, select: { id: true, title: true, order: true, status: true, isPreview: true } });
    await recordAdminAuditWithClient(tx, { actorId, action: "COURSE_LESSON_CREATED", targetType: "COURSE_LESSON", targetId: created.id, afterState: created });
    return created;
  });
}

export async function updateAdminLesson(actorId: string, lessonId: string, input: { title: string; description?: string; duration?: number | null; isPreview?: boolean }, session?: AdminSessionView) {
  const lesson = await prisma.courseLesson.findUnique({ where: { id: lessonId }, select: { id: true, moduleId: true } });
  if (!lesson) throw new AdminServiceError("NOT_FOUND", "جلسه پیدا نشد.");
  await ensureModule(lesson.moduleId, session);
  if (!input.title.trim()) throw new AdminServiceError("VALIDATION_ERROR", "عنوان جلسه را وارد کنید.");
  return prisma.$transaction(async (tx) => {
    const before = await tx.courseLesson.findUnique({ where: { id: lessonId }, select: { title: true, description: true, duration: true, isPreview: true } });
    const updated = await tx.courseLesson.update({ where: { id: lessonId }, data: { title: input.title.trim(), description: input.description?.trim() || null, duration: input.duration ?? null, isPreview: input.isPreview ?? false }, select: { id: true, title: true, description: true, duration: true, isPreview: true } });
    await recordAdminAuditWithClient(tx, { actorId, action: "COURSE_LESSON_UPDATED", targetType: "COURSE_LESSON", targetId: lessonId, beforeState: before, afterState: updated });
    return updated;
  });
}

export async function setAdminLessonStatus(actorId: string, lessonId: string, status: ProductStatus, reason: string, session?: AdminSessionView) {
  const lesson = await prisma.courseLesson.findUnique({ where: { id: lessonId }, select: { moduleId: true } });
  if (!lesson) throw new AdminServiceError("NOT_FOUND", "جلسه پیدا نشد.");
  await ensureModule(lesson.moduleId, session);
  if (!reason.trim()) throw new AdminServiceError("VALIDATION_ERROR", "دلیل تغییر وضعیت جلسه را وارد کنید.");
  return prisma.$transaction(async (tx) => {
    const before = await tx.courseLesson.findUnique({ where: { id: lessonId }, select: { status: true } });
    const updated = await tx.courseLesson.update({ where: { id: lessonId }, data: { status }, select: { id: true, status: true } });
    await recordAdminAuditWithClient(tx, { actorId, action: "COURSE_LESSON_STATUS_CHANGED", targetType: "COURSE_LESSON", targetId: lessonId, beforeState: before, afterState: updated, reason: reason.trim() });
    return updated;
  });
}

export async function reorderAdminLessons(actorId: string, moduleId: string, lessonIds: string[], session?: AdminSessionView) {
  await ensureModule(moduleId, session);
  return prisma.$transaction(async (tx) => {
    const lessons = await tx.courseLesson.findMany({ where: { moduleId }, select: { id: true } });
    if (lessons.length !== lessonIds.length || lessons.some(({ id }) => !lessonIds.includes(id))) throw new AdminServiceError("VALIDATION_ERROR", "ترتیب جلسات معتبر نیست.");
    for (let index = 0; index < lessonIds.length; index += 1) await tx.courseLesson.update({ where: { id: lessonIds[index] }, data: { order: -(index + 1) } });
    for (let index = 0; index < lessonIds.length; index += 1) await tx.courseLesson.update({ where: { id: lessonIds[index] }, data: { order: index } });
    await recordAdminAuditWithClient(tx, { actorId, action: "COURSE_LESSONS_REORDERED", targetType: "COURSE_MODULE", targetId: moduleId, afterState: { lessonIds } });
    return { lessonIds };
  });
}
