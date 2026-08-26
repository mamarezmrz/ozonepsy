import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { countries } from "@/lib/countries";
import { getCurrentUser } from "@/lib/auth/service";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const allowedImageTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);
const countrySet = new Set<string>(countries);
const avatarDirectory = path.join(process.cwd(), "public", "uploads", "avatars");
const avatarUrlPrefix = "/uploads/avatars/";

function readText(formData: FormData, name: string, maxLength: number) {
  const value = formData.get(name);
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function avatarPathFromUrl(url: string | null | undefined) {
  if (!url || !url.startsWith(avatarUrlPrefix)) return null;
  const fileName = url.slice(avatarUrlPrefix.length);
  if (!fileName || path.basename(fileName) !== fileName) return null;
  return path.join(avatarDirectory, fileName);
}

async function removeStoredAvatar(url: string | null | undefined) {
  const filePath = avatarPathFromUrl(url);
  if (!filePath) return;
  try {
    await unlink(filePath);
  } catch {
    // The database reference is authoritative; an orphaned old file can be cleaned up later.
  }
}

function splitDisplayName(displayName: string) {
  if (!displayName) return { firstName: null, lastName: null };
  const [firstName, ...rest] = displayName.split(/\s+/);
  return { firstName: firstName || null, lastName: rest.join(" ") || null };
}

export async function PUT(request: Request) {
  let newAvatarPath: string | null = null;

  try {
    const user = await getCurrentUser();
    if (!user) return Response.json({ ok: false, error: "برای ذخیره اطلاعات ابتدا وارد شوید." }, { status: 401 });

    const formData = await request.formData();
    const displayName = readText(formData, "displayName", 200);
    const phone = readText(formData, "phone", 40);
    const country = readText(formData, "country", 120);
    const removeAvatar = formData.get("removeAvatar") === "true";
    const avatar = formData.get("avatar");

    if (country && !countrySet.has(country)) {
      return Response.json({ ok: false, error: "کشور انتخاب‌شده معتبر نیست." }, { status: 400 });
    }
    if (phone && !/^[+0-9۰-۹()\-\s]{5,40}$/.test(phone)) {
      return Response.json({ ok: false, error: "شماره تلفن واردشده معتبر نیست." }, { status: 400 });
    }
    if (typeof avatar !== "string" && avatar !== null && !(avatar instanceof File)) {
      return Response.json({ ok: false, error: "تصویر انتخاب‌شده معتبر نیست." }, { status: 400 });
    }
    if (avatar instanceof File && avatar.size > 0) {
      const extension = allowedImageTypes.get(avatar.type);
      if (!extension) {
        return Response.json({ ok: false, error: "فرمت تصویر باید JPG، PNG یا WebP باشد." }, { status: 400 });
      }
      if (avatar.size > MAX_AVATAR_SIZE) {
        return Response.json({ ok: false, error: "حجم تصویر نباید بیشتر از ۵ مگابایت باشد." }, { status: 400 });
      }

      await mkdir(avatarDirectory, { recursive: true });
      const fileName = `${randomUUID()}.${extension}`;
      newAvatarPath = path.join(avatarDirectory, fileName);
      await writeFile(newAvatarPath, Buffer.from(await avatar.arrayBuffer()), { flag: "wx" });
    }

    const existingProfile = await prisma.profile.findUnique({
      where: { userId: user.id },
      select: { avatarUrl: true },
    });
    const uploadedAvatarUrl = newAvatarPath ? `${avatarUrlPrefix}${path.basename(newAvatarPath)}` : null;
    const avatarUrl = uploadedAvatarUrl ?? (removeAvatar ? null : existingProfile?.avatarUrl ?? null);
    const nameParts = splitDisplayName(displayName);

    await prisma.profile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        displayName: displayName || null,
        firstName: nameParts.firstName,
        lastName: nameParts.lastName,
        phone: phone || null,
        country: country || null,
        avatarUrl,
      },
      update: {
        displayName: displayName || null,
        firstName: nameParts.firstName,
        lastName: nameParts.lastName,
        phone: phone || null,
        country: country || null,
        avatarUrl,
      },
    });

    if (existingProfile?.avatarUrl && existingProfile.avatarUrl !== avatarUrl) {
      await removeStoredAvatar(existingProfile.avatarUrl);
    }
    newAvatarPath = null;

    return Response.json({
      ok: true,
      message: "تغییرات پروفایل با موفقیت ذخیره شد.",
      profile: { email: user.email, displayName, phone, country, avatarUrl },
    });
  } catch {
    if (newAvatarPath) {
      try { await unlink(newAvatarPath); } catch { /* cleanup is best effort */ }
    }
    return Response.json({ ok: false, error: "ذخیره تغییرات در حال حاضر امکان‌پذیر نیست." }, { status: 500 });
  }
}
