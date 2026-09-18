import { randomUUID } from "node:crypto";
import { MediaStatus, MediaVisibility, RoleName, SpecialistStatus, UserStatus } from "@/lib/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { AdminServiceError } from "@/lib/admin/errors";
import { recordAdminAuditWithClient } from "@/lib/admin/audit";
import { pageMeta, paginationOffset, type AdminListQuery } from "@/lib/admin/query";
import type { AdminSessionView } from "@/lib/admin/session";
import { hashPassword } from "@/lib/auth/password";
import { sendTherapistCredentialsEmail } from "@/lib/auth/email";
import { legacySpecialistProfileSections, parseSpecialistProfileSections, type SpecialistProfileSection } from "@/lib/specialist-profile";

function scopedWhere(session?: AdminSessionView) {
  return session?.roles.includes("INSTRUCTOR") && !session.roles.some((role) => role === "ADMIN" || role === "SUPER_ADMIN") ? { userId: session.userId } : {};
}

function generatedSlug(value: string) {
  const latinSlug = value.trim().toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 90);
  return `${latinSlug || "specialist"}-${randomUUID().slice(0, 8)}`;
}

export async function listAdminSpecialists(query: AdminListQuery, status?: SpecialistStatus, session?: AdminSessionView) {
  const where = {
    ...scopedWhere(session),
    ...(status ? { status } : {}),
    ...(query.search ? { OR: [
      { displayName: { contains: query.search, mode: "insensitive" as const } },
      { slug: { contains: query.search, mode: "insensitive" as const } },
      { specialty: { contains: query.search, mode: "insensitive" as const } },
      { email: { contains: query.search, mode: "insensitive" as const } },
      { phone: { contains: query.search, mode: "insensitive" as const } },
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
      select: { id: true, slug: true, displayName: true, specialty: true, phone: true, country: true, email: true, status: true, imageUrl: true, userId: true, user: { select: { status: true } }, createdAt: true, _count: { select: { appointments: true, courseAssignments: true } } },
    }),
  ]);
  return { rows: rows.map((row) => ({ ...row, appointmentCount: row._count.appointments, courseCount: row._count.courseAssignments })), meta: pageMeta(total, query) };
}

export async function listAdminSpecialistOptions() {
  return prisma.specialist.findMany({
    where: { status: SpecialistStatus.ACTIVE },
    orderBy: { displayName: "asc" },
    select: { id: true, displayName: true },
  });
}

export async function getAdminSpecialist(id: string, session?: AdminSessionView) {
  const row = await prisma.specialist.findFirst({
    where: { id, ...scopedWhere(session) },
    select: {
       id: true, slug: true, displayName: true, specialty: true, phone: true, country: true, email: true, bio: true, aboutTitle: true, aboutDescription: true, specialtiesTitle: true, specialtiesItems: true, educationTitle: true, educationItems: true, responsibilitiesTitle: true, responsibilitiesItems: true, booksTitle: true, booksItems: true, quoteTitle: true, quote: true, profileSections: true, imageUrl: true, profileMediaId: true, status: true, userId: true, createdAt: true, updatedAt: true,
       user: { select: { id: true, email: true, status: true, mustChangePassword: true, profile: { select: { displayName: true, firstName: true, lastName: true } } } },
      courseAssignments: { select: { courseProductId: true, courseProduct: { select: { product: { select: { id: true, title: true, slug: true, status: true } } } } } },
      _count: { select: { appointments: true } },
    },
  });
  if (!row) throw new AdminServiceError("NOT_FOUND", "متخصص پیدا نشد.");
  return { ...row, profileSections: parseSpecialistProfileSections(row.profileSections).length ? parseSpecialistProfileSections(row.profileSections) : legacySpecialistProfileSections(row) };
}

function splitDisplayName(displayName: string) {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  return { firstName: parts.shift() || null, lastName: parts.join(" ") || null };
}

type SpecialistMutationInput = { slug?: string; displayName: string; specialty?: string; aboutTitle?: string; aboutDescription?: string; specialtiesTitle?: string; specialtiesItems?: string[]; educationTitle?: string; educationItems?: string[]; responsibilitiesTitle?: string; responsibilitiesItems?: string[]; booksTitle?: string; booksItems?: string[]; quoteTitle?: string; quote?: string; profileSections?: SpecialistProfileSection[]; phone?: string; country?: string; email?: string; bio?: string; profileMediaId?: string | null; imageUrl?: string | null; userId?: string | null; initialPassword?: string; initialPasswordConfirmation?: string; accountActive?: boolean };

function contentItems(items?: string[]) {
  return [...new Set((items ?? []).map((item) => item.trim()).filter(Boolean))].slice(0, 50);
}

function specialistContentData(input: SpecialistMutationInput) {
  const sections = input.profileSections?.map((section) => ({ id: section.id.trim(), title: section.title.trim(), description: section.description.trim() })).filter((section) => section.title || section.description);
  return {
    ...(input.profileSections === undefined ? {} : { profileSections: sections, aboutTitle: null, aboutDescription: null, specialtiesTitle: null, specialtiesItems: [], educationTitle: null, educationItems: [], responsibilitiesTitle: null, responsibilitiesItems: [], booksTitle: null, booksItems: [], quoteTitle: null, quote: null }),
    ...(input.aboutTitle === undefined ? {} : { aboutTitle: input.aboutTitle.trim() || null }),
    ...(input.aboutDescription === undefined ? {} : { aboutDescription: input.aboutDescription.trim() || null }),
    ...(input.specialtiesTitle === undefined ? {} : { specialtiesTitle: input.specialtiesTitle.trim() || null }),
    ...(input.specialtiesItems === undefined ? {} : { specialtiesItems: contentItems(input.specialtiesItems) }),
    ...(input.educationTitle === undefined ? {} : { educationTitle: input.educationTitle.trim() || null }),
    ...(input.educationItems === undefined ? {} : { educationItems: contentItems(input.educationItems) }),
    ...(input.responsibilitiesTitle === undefined ? {} : { responsibilitiesTitle: input.responsibilitiesTitle.trim() || null }),
    ...(input.responsibilitiesItems === undefined ? {} : { responsibilitiesItems: contentItems(input.responsibilitiesItems) }),
    ...(input.booksTitle === undefined ? {} : { booksTitle: input.booksTitle.trim() || null }),
    ...(input.booksItems === undefined ? {} : { booksItems: contentItems(input.booksItems) }),
    ...(input.quoteTitle === undefined ? {} : { quoteTitle: input.quoteTitle.trim() || null }),
    ...(input.quote === undefined ? {} : { quote: input.quote.trim() || null }),
  };
}

async function ensureProfileMedia(profileMediaId?: string | null) {
  if (!profileMediaId) return;
  const media = await prisma.mediaAsset.findFirst({ where: { id: profileMediaId, status: MediaStatus.ACTIVE, visibility: MediaVisibility.PUBLIC, mimeType: { startsWith: "image/" } }, select: { id: true } });
  if (!media) throw new AdminServiceError("VALIDATION_ERROR", "تصویر پروفایل معتبر یا عمومی نیست.");
}

function normalizedEmail(value?: string) {
  return value?.trim().toLowerCase() || null;
}

export async function createAdminSpecialist(actorId: string, input: SpecialistMutationInput) {
  const email = normalizedEmail(input.email);
  if (!email) throw new AdminServiceError("VALIDATION_ERROR", "ایمیل ورود متخصص را وارد کنید.");
  if (!input.initialPassword) throw new AdminServiceError("VALIDATION_ERROR", "رمز اولیه متخصص را وارد کنید.");
  const passwordHash = await hashPassword(input.initialPassword);
  const displayName = input.displayName.trim();
  if (!displayName) throw new AdminServiceError("VALIDATION_ERROR", "نام و نام خانوادگی متخصص را وارد کنید.");
  const accountActive = input.accountActive !== false;
  const name = splitDisplayName(displayName);
  await ensureProfileMedia(input.profileMediaId);

  try {
    return await prisma.$transaction(async (tx) => {
      const created = await tx.specialist.create({
        data: {
          slug: input.slug?.trim().toLowerCase() || generatedSlug(displayName),
          displayName,
          specialty: input.specialty?.trim() || null,
          phone: input.phone?.trim() || null,
          country: input.country?.trim() || null,
          email,
          bio: input.quote?.trim() || input.bio?.trim() || null,
          ...specialistContentData(input),
          imageUrl: input.profileMediaId ? null : input.imageUrl?.trim() || null,
          profileMedia: input.profileMediaId ? { connect: { id: input.profileMediaId } } : undefined,
          status: accountActive ? SpecialistStatus.ACTIVE : SpecialistStatus.INACTIVE,
          user: {
            create: {
              email,
              passwordHash,
              status: accountActive ? UserStatus.ACTIVE : UserStatus.SUSPENDED,
              mustChangePassword: true,
              profile: { create: { displayName, firstName: name.firstName, lastName: name.lastName, phone: input.phone?.trim() || null, country: input.country?.trim() || null } },
              roles: { create: { role: { connectOrCreate: { where: { name: RoleName.THERAPIST }, create: { name: RoleName.THERAPIST } } } } },
            },
          },
        },
        select: { id: true, slug: true, displayName: true, status: true, user: { select: { id: true, email: true, status: true } } },
      });
      await recordAdminAuditWithClient(tx, { actorId, action: "SPECIALIST_CREATED", targetType: "SPECIALIST", targetId: created.id, afterState: { id: created.id, email: created.user?.email ?? email, status: created.status, accountStatus: created.user?.status ?? null } });
      return created;
    }).then(async (created) => {
      await sendTherapistCredentialsEmail({ email, displayName, temporaryPassword: input.initialPassword! });
      return created;
    });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") throw new AdminServiceError("CONFLICT", "کاربری با این ایمیل یا اسلاگ از قبل وجود دارد.");
    throw error;
  }
}

export async function updateAdminSpecialist(actorId: string, id: string, input: SpecialistMutationInput, session?: AdminSessionView) {
  const before = await prisma.specialist.findFirst({ where: { id, ...scopedWhere(session) }, select: { id: true, slug: true, bio: true, aboutTitle: true, aboutDescription: true, specialtiesTitle: true, specialtiesItems: true, educationTitle: true, educationItems: true, responsibilitiesTitle: true, responsibilitiesItems: true, booksTitle: true, booksItems: true, quoteTitle: true, quote: true, imageUrl: true, profileMediaId: true, userId: true, email: true, displayName: true, specialty: true, phone: true, country: true, status: true, user: { select: { id: true, email: true, status: true } } } });
  if (!before) throw new AdminServiceError("NOT_FOUND", "متخصص پیدا نشد.");
  const displayName = input.displayName.trim();
  if (!displayName) throw new AdminServiceError("VALIDATION_ERROR", "نام و نام خانوادگی متخصص را وارد کنید.");
  const email = normalizedEmail(input.email) ?? before.user?.email ?? before.email;
  const accountActive = input.accountActive;
  const name = splitDisplayName(displayName);
  await ensureProfileMedia(input.profileMediaId);

  try {
    return await prisma.$transaction(async (tx) => {
      let userId = before.userId;
      if (!userId && input.email) {
        if (!input.initialPassword) throw new AdminServiceError("VALIDATION_ERROR", "برای ساخت دسترسی متخصص، رمز اولیه را وارد کنید.");
        const user = await tx.user.create({
          data: {
            email: email ?? input.email.trim().toLowerCase(),
            passwordHash: await hashPassword(input.initialPassword),
            status: accountActive === false ? UserStatus.SUSPENDED : UserStatus.ACTIVE,
            mustChangePassword: true,
            profile: { create: { displayName, firstName: name.firstName, lastName: name.lastName, phone: input.phone?.trim() || null, country: input.country?.trim() || null } },
            roles: { create: { role: { connectOrCreate: { where: { name: RoleName.THERAPIST }, create: { name: RoleName.THERAPIST } } } } },
          },
          select: { id: true, email: true, status: true },
        });
        userId = user.id;
      }

      if (userId) {
        const userData = {
          ...(email ? { email } : {}),
          ...(accountActive === undefined ? {} : { status: accountActive ? UserStatus.ACTIVE : UserStatus.SUSPENDED }),
          ...(input.initialPassword ? { passwordHash: await hashPassword(input.initialPassword), mustChangePassword: true } : {}),
          profile: { upsert: { create: { displayName, firstName: name.firstName, lastName: name.lastName, phone: input.phone?.trim() || null, country: input.country?.trim() || null }, update: { displayName, firstName: name.firstName, lastName: name.lastName, phone: input.phone?.trim() || null, country: input.country?.trim() || null } } },
        };
        await tx.user.update({ where: { id: userId }, data: userData });
        if (accountActive === false || input.initialPassword) await tx.authSession.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
      }

      const updated = await tx.specialist.update({ where: { id }, data: { slug: input.slug?.trim().toLowerCase() || before.slug, displayName, specialty: input.specialty?.trim() || null, phone: input.phone?.trim() || null, country: input.country?.trim() || null, email: email ?? null, bio: input.quote === undefined && input.bio === undefined ? before.bio : input.quote?.trim() || input.bio?.trim() || null, imageUrl: input.profileMediaId ? null : before.imageUrl, profileMediaId: input.profileMediaId === undefined ? before.profileMediaId : input.profileMediaId || null, ...specialistContentData(input), userId, ...(accountActive === undefined ? {} : { status: accountActive ? SpecialistStatus.ACTIVE : SpecialistStatus.INACTIVE }) }, select: { id: true, slug: true, displayName: true, specialty: true, phone: true, country: true, email: true, bio: true, aboutTitle: true, aboutDescription: true, specialtiesTitle: true, specialtiesItems: true, educationTitle: true, educationItems: true, responsibilitiesTitle: true, responsibilitiesItems: true, booksTitle: true, booksItems: true, quoteTitle: true, quote: true, imageUrl: true, profileMediaId: true, userId: true, status: true } });
      await recordAdminAuditWithClient(tx, { actorId, action: "SPECIALIST_UPDATED", targetType: "SPECIALIST", targetId: id, beforeState: { ...before, user: before.user ? { id: before.user.id, email: before.user.email, status: before.user.status } : null }, afterState: updated });
      return updated;
    }).then(async (updated) => {
      if (input.initialPassword && email) await sendTherapistCredentialsEmail({ email, displayName, temporaryPassword: input.initialPassword });
      return updated;
    });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") throw new AdminServiceError("CONFLICT", "این ایمیل یا اسلاگ برای متخصص دیگری ثبت شده است.");
    throw error;
  }
}

export async function resetAdminSpecialistPassword(actorId: string, id: string, password: string, reason: string, session?: AdminSessionView) {
  const trimmedReason = reason.trim();
  if (!trimmedReason) throw new AdminServiceError("VALIDATION_ERROR", "دلیل تغییر رمز را وارد کنید.");
  const passwordHash = await hashPassword(password);
  return prisma.$transaction(async (tx) => {
    const before = await tx.specialist.findFirst({ where: { id, ...scopedWhere(session) }, select: { id: true, userId: true, user: { select: { email: true } } } });
    if (!before) throw new AdminServiceError("NOT_FOUND", "متخصص پیدا نشد.");
    if (!before.userId) throw new AdminServiceError("CONFLICT", "این متخصص هنوز حساب ورود ندارد.");
    await tx.user.update({ where: { id: before.userId }, data: { passwordHash, mustChangePassword: true } });
    const revoked = await tx.authSession.updateMany({ where: { userId: before.userId, revokedAt: null }, data: { revokedAt: new Date() } });
    await recordAdminAuditWithClient(tx, { actorId, action: "SPECIALIST_PASSWORD_RESET", targetType: "USER", targetId: before.userId, afterState: { email: before.user?.email, mustChangePassword: true, sessionsRevoked: revoked.count }, reason: trimmedReason });
    return { id, email: before.user?.email ?? null, sessionsRevoked: revoked.count };
  }).then(async (result) => {
    if (result.email) await sendTherapistCredentialsEmail({ email: result.email, temporaryPassword: password, reset: true });
    return { id: result.id, sessionsRevoked: result.sessionsRevoked };
  });
}

export async function setAdminSpecialistStatus(actorId: string, id: string, status: SpecialistStatus, reason: string, session?: AdminSessionView) {
  const trimmedReason = reason.trim();
  if (!trimmedReason) throw new AdminServiceError("VALIDATION_ERROR", "دلیل تغییر وضعیت متخصص را وارد کنید.");
  return prisma.$transaction(async (tx) => {
    const before = await tx.specialist.findFirst({ where: { id, ...scopedWhere(session) }, select: { id: true, status: true } });
    if (!before) throw new AdminServiceError("NOT_FOUND", "متخصص پیدا نشد.");
    if (before.status === status) throw new AdminServiceError("CONFLICT", "متخصص از قبل همین وضعیت را دارد.");
    const updated = await tx.specialist.update({ where: { id }, data: { status }, select: { id: true, status: true } });
    await recordAdminAuditWithClient(tx, { actorId, action: status === SpecialistStatus.ACTIVE ? "SPECIALIST_ACTIVATED" : "SPECIALIST_DEACTIVATED", targetType: "SPECIALIST", targetId: id, beforeState: before, afterState: updated, reason: trimmedReason });
    return updated;
  });
}

export async function assignAdminSpecialistCourses(actorId: string, id: string, courseIds: string[], session?: AdminSessionView) {
  return prisma.$transaction(async (tx) => {
    const specialist = await tx.specialist.findFirst({ where: { id, ...scopedWhere(session) }, select: { id: true } });
    if (!specialist) throw new AdminServiceError("NOT_FOUND", "متخصص پیدا نشد.");
    const courses = await tx.courseProduct.findMany({ where: { productId: { in: courseIds } }, select: { productId: true } });
    if (courses.length !== new Set(courseIds).size) throw new AdminServiceError("VALIDATION_ERROR", "یکی از دوره‌های انتخاب‌شده معتبر نیست.");
    await tx.courseSpecialist.deleteMany({ where: { specialistId: id } });
    if (courseIds.length) await tx.courseSpecialist.createMany({ data: courseIds.map((courseProductId) => ({ specialistId: id, courseProductId })), skipDuplicates: true });
    await recordAdminAuditWithClient(tx, { actorId, action: "SPECIALIST_COURSES_ASSIGNED", targetType: "SPECIALIST", targetId: id, afterState: { courseIds } });
    return { courseIds };
  });
}
