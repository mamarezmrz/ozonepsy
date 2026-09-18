import { NextResponse } from "next/server";
import { hasSameOrigin } from "@/lib/admin/security";
import { requireAdminPermissionFromSession } from "@/lib/admin/authorization";
import { requireAdminSession } from "@/lib/admin/session";
import { adminErrorResponse } from "@/lib/admin/errors";
import { createAdminMedia } from "@/lib/admin/media";
import { getMediaStorage } from "@/lib/media/storage";
import { sanitizeOriginalName, validateImageBytes } from "@/lib/media/validation";
import { MediaVisibility } from "@/lib/generated/prisma/enums";

export const runtime = "nodejs";

const maxImageUploadBytes = 10 * 1024 * 1024;

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) return NextResponse.json({ code: "FORBIDDEN", message: "درخواست نامعتبر است." }, { status: 403 });
  try {
    const session = await requireAdminSession();
    requireAdminPermissionFromSession(session, "instructors.write");
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) return NextResponse.json({ code: "VALIDATION_ERROR", message: "فایل تصویر را انتخاب کنید." }, { status: 400 });
    if (file.size > maxImageUploadBytes) return NextResponse.json({ code: "VALIDATION_ERROR", message: "حجم تصویر نباید بیشتر از ۱۰ مگابایت باشد." }, { status: 400 });

    const body = new Uint8Array(await file.arrayBuffer());
    let extension: string;
    try {
      extension = validateImageBytes(file.type, body);
    } catch (error) {
      return NextResponse.json({ code: "VALIDATION_ERROR", message: error instanceof Error ? error.message : "فایل تصویر معتبر نیست." }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const storageKey = `specialists/${id}.${extension}`;
    const storage = getMediaStorage();
    await storage.put({ storageKey, body, contentType: file.type });
    try {
      const media = await createAdminMedia(session, {
        id,
        storageKey,
        originalName: sanitizeOriginalName(file.name),
        mimeType: file.type,
        extension,
        size: body.byteLength,
        visibility: MediaVisibility.PUBLIC,
      });
      return NextResponse.json({ ok: true, data: { id: media.id }, message: "تصویر متخصص بارگذاری شد." }, { status: 201 });
    } catch (error) {
      await storage.delete(storageKey).catch(() => undefined);
      throw error;
    }
  } catch (error) {
    return adminErrorResponse(error);
  }
}
