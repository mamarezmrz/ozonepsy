import { NextResponse } from "next/server";
import { isAdminHost } from "@/lib/admin/host";
import { hasSameOrigin } from "@/lib/security/request";
import { requireAdminPermissionFromSession } from "@/lib/admin/authorization";
import { requireAdminSession } from "@/lib/admin/session";
import { adminErrorResponse } from "@/lib/admin/errors";
import { createAdminMedia, listAdminMedia } from "@/lib/admin/media";
import { parseAdminListQuery } from "@/lib/admin/query";
import { MediaStatus, MediaVisibility } from "@/lib/generated/prisma/enums";
import { getMediaStorage } from "@/lib/media/storage";
import { sanitizeOriginalName, validateImageBytes } from "@/lib/media/validation";

export const runtime = "nodejs";
const maxUploadBytes = 10 * 1024 * 1024;

export async function GET(request: Request) {
  if (!isAdminHost(request.headers.get("host"))) return NextResponse.json({ code: "NOT_FOUND", message: "یافت نشد." }, { status: 404 });
  try {
    const session = await requireAdminSession(); requireAdminPermissionFromSession(session, "media.read");
    const url = new URL(request.url); const query = parseAdminListQuery(url.searchParams, ["createdAt", "originalName", "size"]);
    const visibility = Object.values(MediaVisibility).includes(url.searchParams.get("visibility") as MediaVisibility) ? url.searchParams.get("visibility") as MediaVisibility : undefined;
    const status = Object.values(MediaStatus).includes(url.searchParams.get("status") as MediaStatus) ? url.searchParams.get("status") as MediaStatus : undefined;
    return NextResponse.json({ ok: true, data: await listAdminMedia(query, visibility, status) });
  } catch (error) { return adminErrorResponse(error); }
}

export async function POST(request: Request) {
  if (!isAdminHost(request.headers.get("host"))) return NextResponse.json({ code: "NOT_FOUND", message: "یافت نشد." }, { status: 404 });
  if (!hasSameOrigin(request)) return NextResponse.json({ code: "FORBIDDEN", message: "درخواست معتبر نیست." }, { status: 403 });
  try {
    const session = await requireAdminSession(); requireAdminPermissionFromSession(session, "media.write");
    const form = await request.formData(); const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) return NextResponse.json({ code: "VALIDATION_ERROR", message: "فایل تصویر را انتخاب کنید." }, { status: 400 });
    if (file.size > maxUploadBytes) return NextResponse.json({ code: "VALIDATION_ERROR", message: "حجم فایل نباید بیشتر از ۱۰ مگابایت باشد." }, { status: 400 });
    const body = new Uint8Array(await file.arrayBuffer());
    let extension: string;
    try { extension = validateImageBytes(file.type, body); } catch (error) { return NextResponse.json({ code: "VALIDATION_ERROR", message: error instanceof Error ? error.message : "فایل تصویر معتبر نیست." }, { status: 400 }); }
    const id = crypto.randomUUID(); const storageKey = `admin/${id}.${extension}`; const originalName = sanitizeOriginalName(file.name);
    const storage = getMediaStorage();
    await storage.put({ storageKey, body, contentType: file.type });
    try {
      const visibility = form.get("visibility") === "PUBLIC" ? MediaVisibility.PUBLIC : MediaVisibility.PRIVATE;
      const created = await createAdminMedia(session, { id, storageKey, originalName, mimeType: file.type, extension, size: body.byteLength, visibility });
      return NextResponse.json({ ok: true, message: "رسانه با موفقیت بارگذاری شد.", data: created }, { status: 201 });
    } catch (error) { await storage.delete(storageKey).catch(() => undefined); throw error; }
  } catch (error) { return adminErrorResponse(error); }
}
