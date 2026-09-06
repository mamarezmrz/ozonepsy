import { randomUUID } from "node:crypto";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { MediaStatus, MediaVisibility } from "@/lib/generated/prisma/enums";
import { countries } from "@/lib/countries";
import { getCurrentUser } from "@/lib/auth/service";
import { prisma } from "@/lib/prisma";
import { hasSameOrigin } from "@/lib/security/request";
import { getMediaStorage } from "@/lib/media/storage";
import { sanitizeOriginalName, validateImageBytes } from "@/lib/media/validation";

export const runtime = "nodejs";

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const countrySet = new Set<string>(countries);
const legacyAvatarPrefix = "/uploads/avatars/";

function readText(formData: FormData, name: string, maxLength: number) {
  const value = formData.get(name);
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function splitDisplayName(displayName: string) {
  if (!displayName) return { firstName: null, lastName: null };
  const [firstName, ...rest] = displayName.split(/\s+/);
  return { firstName: firstName || null, lastName: rest.join(" ") || null };
}

function mediaIdFromUrl(url: string | null | undefined) {
  const match = url?.match(/^\/api\/media\/([0-9a-f-]{36})$/i);
  return match?.[1] ?? null;
}

async function removeLegacyAvatar(url: string | null | undefined) {
  if (!url?.startsWith(legacyAvatarPrefix)) return;
  const fileName = url.slice(legacyAvatarPrefix.length);
  if (!fileName || path.basename(fileName) !== fileName) return;
  try { await unlink(path.join(process.cwd(), "public", "uploads", "avatars", fileName)); } catch { /* cleanup is best effort */ }
}

export async function PUT(request: Request) {
  let newStorageKey: string | null = null;

  try {
    if (!hasSameOrigin(request)) return Response.json({ ok: false, error: "درخواست معتبر نیست." }, { status: 403 });
    const user = await getCurrentUser();
    if (!user) return Response.json({ ok: false, error: "برای ذخیره اطلاعات ابتدا وارد شوید." }, { status: 401 });

    const formData = await request.formData();
    const displayName = readText(formData, "displayName", 200);
    const phone = readText(formData, "phone", 40);
    const country = readText(formData, "country", 120);
    const removeAvatar = formData.get("removeAvatar") === "true";
    const avatar = formData.get("avatar");

    if (country && !countrySet.has(country)) return Response.json({ ok: false, error: "کشور انتخاب‌شده معتبر نیست." }, { status: 400 });
    if (phone && !/^[+0-9۰-۹()\-\s]{5,40}$/.test(phone)) return Response.json({ ok: false, error: "شماره تلفن واردشده معتبر نیست." }, { status: 400 });
    if (!(avatar === null || avatar instanceof File || typeof avatar === "string")) return Response.json({ ok: false, error: "تصویر انتخاب‌شده معتبر نیست." }, { status: 400 });

    let uploaded: { storageKey: string; mimeType: string; extension: string; size: number; originalName: string } | null = null;
    if (avatar instanceof File && avatar.size > 0) {
      if (!allowedImageTypes.has(avatar.type)) return Response.json({ ok: false, error: "فرمت تصویر باید JPG، PNG یا WebP باشد." }, { status: 400 });
      if (avatar.size > MAX_AVATAR_SIZE) return Response.json({ ok: false, error: "حجم تصویر نباید بیشتر از ۵ مگابایت باشد." }, { status: 400 });
      const body = new Uint8Array(await avatar.arrayBuffer());
      const extension = validateImageBytes(avatar.type, body);
      newStorageKey = `avatars/${randomUUID()}.${extension}`;
      await getMediaStorage().put({ storageKey: newStorageKey, body, contentType: avatar.type });
      uploaded = { storageKey: newStorageKey, mimeType: avatar.type, extension, size: body.byteLength, originalName: sanitizeOriginalName(avatar.name) };
    }

    const existingProfile = await prisma.profile.findUnique({ where: { userId: user.id }, select: { avatarUrl: true } });
    const oldMediaId = mediaIdFromUrl(existingProfile?.avatarUrl);
    const oldMedia = oldMediaId ? await prisma.mediaAsset.findUnique({ where: { id: oldMediaId }, select: { storageKey: true } }) : null;
    const nameParts = splitDisplayName(displayName);

    const result = await prisma.$transaction(async (tx) => {
      let avatarUrl = existingProfile?.avatarUrl ?? null;
      let createdMediaId: string | null = null;
      if (uploaded) {
        const media = await tx.mediaAsset.create({
          data: { storageKey: uploaded.storageKey, originalName: uploaded.originalName, mimeType: uploaded.mimeType, extension: uploaded.extension, size: uploaded.size, visibility: MediaVisibility.PUBLIC, status: MediaStatus.ACTIVE, uploaderId: user.id },
          select: { id: true },
        });
        createdMediaId = media.id;
        avatarUrl = `/api/media/${media.id}`;
      } else if (removeAvatar) {
        avatarUrl = null;
      }
      if (oldMediaId && oldMediaId !== createdMediaId && (uploaded || removeAvatar)) await tx.mediaAsset.updateMany({ where: { id: oldMediaId, status: MediaStatus.ACTIVE }, data: { status: MediaStatus.ARCHIVED } });
      const name = await tx.profile.upsert({
        where: { userId: user.id },
        create: { userId: user.id, displayName: displayName || null, firstName: nameParts.firstName, lastName: nameParts.lastName, phone: phone || null, country: country || null, avatarUrl },
        update: { displayName: displayName || null, firstName: nameParts.firstName, lastName: nameParts.lastName, phone: phone || null, country: country || null, avatarUrl },
        select: { avatarUrl: true },
      });
      return name.avatarUrl;
    });

    const storage = getMediaStorage();
    if (oldMedia && (uploaded || removeAvatar)) await storage.delete(oldMedia.storageKey).catch(() => undefined);
    if (existingProfile?.avatarUrl && (uploaded || removeAvatar)) await removeLegacyAvatar(existingProfile.avatarUrl);
    newStorageKey = null;
    return Response.json({ ok: true, message: "تغییرات پروفایل با موفقیت ذخیره شد.", profile: { email: user.email, displayName, phone, country, avatarUrl: result } });
  } catch (error) {
    if (newStorageKey) await getMediaStorage().delete(newStorageKey).catch(() => undefined);
    if (error instanceof Error && error.message === "فایل تصویر معتبر نیست.") return Response.json({ ok: false, error: error.message }, { status: 400 });
    return Response.json({ ok: false, error: "ذخیره تغییرات در حال حاضر امکان‌پذیر نیست." }, { status: 500 });
  }
}
