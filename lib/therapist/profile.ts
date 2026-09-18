import { randomUUID } from "node:crypto";
import { z } from "zod";
import { MediaStatus, MediaVisibility } from "@/lib/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { AdminServiceError } from "@/lib/admin/errors";
import { recordAdminAuditWithClient } from "@/lib/admin/audit";
import { getMediaStorage } from "@/lib/media/storage";
import { sanitizeOriginalName, validateImageBytes } from "@/lib/media/validation";
import type { SpecialistProfileSection } from "@/lib/specialist-profile";

const profileSectionSchema = z.object({
  id: z.string().trim().min(1).max(120),
  title: z.string().trim().max(240),
  description: z.string().trim().max(20000),
});

function parseProfileSections(value: unknown) {
  if (value === undefined || value === null || value === "") return [];
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : value;
  } catch {
    return value;
  }
}

export const therapistProfileSchema = z.object({
  slug: z.string().trim().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "شناسه صفحه معتبر نیست."),
  displayName: z.string().trim().min(1, "نام و نام خانوادگی را وارد کنید.").max(200),
  email: z.string().trim().email("ایمیل معتبر نیست.").max(320).transform((value) => value.toLowerCase()),
  specialty: z.string().trim().max(200, "تخصص بیش از حد طولانی است."),
  phone: z.string().trim().max(40, "شماره تماس بیش از حد طولانی است."),
  country: z.string().trim().max(120, "نام کشور بیش از حد طولانی است."),
  bio: z.string().trim().max(10000, "معرفی بیش از حد طولانی است."),
  profileSections: z.preprocess(parseProfileSections, z.array(profileSectionSchema).max(50).default([])),
});

export type TherapistProfileInput = z.infer<typeof therapistProfileSchema>;

function splitDisplayName(displayName: string) {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  return { firstName: parts.shift() || null, lastName: parts.join(" ") || null };
}

export async function updateTherapistProfile(userId: string, specialistId: string, input: TherapistProfileInput, imageFile?: File) {
  const before = await prisma.specialist.findFirst({
    where: { id: specialistId, userId },
    select: {
      id: true,
      slug: true,
      displayName: true,
      specialty: true,
      phone: true,
      country: true,
      email: true,
      bio: true,
      aboutTitle: true,
      aboutDescription: true,
      specialtiesTitle: true,
      specialtiesItems: true,
      educationTitle: true,
      educationItems: true,
      responsibilitiesTitle: true,
      responsibilitiesItems: true,
      booksTitle: true,
      booksItems: true,
      quoteTitle: true,
      quote: true,
      profileSections: true,
      imageUrl: true,
      profileMediaId: true,
    },
  });
  if (!before) throw new AdminServiceError("NOT_FOUND", "پروفایل متخصص پیدا نشد.");

  const sections = input.profileSections.filter((section) => section.title.trim() || section.description.trim()).map((section) => ({
    id: section.id.trim(),
    title: section.title.trim(),
    description: section.description.trim(),
  })) satisfies SpecialistProfileSection[];

  let uploaded: { id: string; storageKey: string; originalName: string; mimeType: string; extension: string; size: number } | null = null;
  if (imageFile && imageFile.size > 0) {
    if (imageFile.size > 10 * 1024 * 1024) throw new AdminServiceError("VALIDATION_ERROR", "حجم تصویر نباید بیشتر از ۱۰ مگابایت باشد.");
    const body = new Uint8Array(await imageFile.arrayBuffer());
    let extension: string;
    try {
      extension = validateImageBytes(imageFile.type, body);
    } catch (error) {
      throw new AdminServiceError("VALIDATION_ERROR", error instanceof Error ? error.message : "فایل تصویر معتبر نیست.");
    }
    const id = randomUUID();
    const storageKey = `specialists/${id}.${extension}`;
    await getMediaStorage().put({ storageKey, body, contentType: imageFile.type });
    uploaded = { id, storageKey, originalName: sanitizeOriginalName(imageFile.name), mimeType: imageFile.type, extension, size: body.byteLength };
  }

  const name = splitDisplayName(input.displayName);
  try {
    return await prisma.$transaction(async (tx) => {
      if (uploaded) {
        await tx.mediaAsset.create({
          data: {
            id: uploaded.id,
            storageKey: uploaded.storageKey,
            originalName: uploaded.originalName,
            mimeType: uploaded.mimeType,
            extension: uploaded.extension,
            size: uploaded.size,
            visibility: MediaVisibility.PUBLIC,
            status: MediaStatus.ACTIVE,
            uploaderId: userId,
          },
          select: { id: true },
        });
      }

      const updated = await tx.specialist.update({
        where: { id: specialistId },
        data: {
          slug: input.slug.toLowerCase(),
          displayName: input.displayName,
          specialty: input.specialty || null,
          phone: input.phone || null,
          country: input.country || null,
          email: input.email,
          bio: input.bio || null,
          aboutTitle: null,
          aboutDescription: null,
          specialtiesTitle: null,
          specialtiesItems: [],
          educationTitle: null,
          educationItems: [],
          responsibilitiesTitle: null,
          responsibilitiesItems: [],
          booksTitle: null,
          booksItems: [],
          quoteTitle: null,
          quote: null,
          profileSections: sections,
          ...(uploaded ? { profileMediaId: uploaded.id, imageUrl: null } : {}),
        },
        select: { id: true, slug: true, displayName: true, email: true, specialty: true, phone: true, country: true, bio: true, profileSections: true, imageUrl: true, profileMediaId: true },
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          email: input.email,
          profile: {
            upsert: {
              create: { displayName: input.displayName, firstName: name.firstName, lastName: name.lastName, phone: input.phone || null, country: input.country || null },
              update: { displayName: input.displayName, firstName: name.firstName, lastName: name.lastName, phone: input.phone || null, country: input.country || null },
            },
          },
        },
      });

      await recordAdminAuditWithClient(tx, {
        actorId: userId,
        action: "THERAPIST_PROFILE_UPDATED",
        targetType: "SPECIALIST",
        targetId: specialistId,
        beforeState: before,
        afterState: updated,
      });
      return updated;
    });
  } catch (error) {
    if (uploaded) await getMediaStorage().delete(uploaded.storageKey).catch(() => undefined);
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") throw new AdminServiceError("CONFLICT", "این ایمیل یا شناسه صفحه قبلاً استفاده شده است.");
    throw error;
  }
}
