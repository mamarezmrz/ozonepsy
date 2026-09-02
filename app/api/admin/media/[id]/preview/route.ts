import { NextResponse } from "next/server";
import { isAdminHost } from "@/lib/admin/host";
import { requireAdminPermissionFromSession } from "@/lib/admin/authorization";
import { requireAdminSession } from "@/lib/admin/session";
import { adminErrorResponse } from "@/lib/admin/errors";
import { getAdminMedia } from "@/lib/admin/media";
import { getMediaStorage } from "@/lib/media/storage";
import { MediaStatus } from "@/lib/generated/prisma/enums";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminHost(request.headers.get("host"))) return NextResponse.json({ code: "NOT_FOUND", message: "یافت نشد." }, { status: 404 });
  try {
    const session = await requireAdminSession();
    requireAdminPermissionFromSession(session, "media.read");
    const media = await getAdminMedia((await params).id, session);
    if (media.status === MediaStatus.ARCHIVED) return NextResponse.json({ code: "NOT_FOUND", message: "یافت نشد." }, { status: 404 });
    const body = await getMediaStorage().get(media.storageKey);
    if (!body) return NextResponse.json({ code: "NOT_FOUND", message: "فایل رسانه پیدا نشد." }, { status: 404 });
    return new Response(body as unknown as BodyInit, {
      headers: {
        "Content-Type": media.mimeType,
        "Content-Length": String(body.byteLength),
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(media.originalName)}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
