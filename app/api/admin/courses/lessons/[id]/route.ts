import { NextResponse } from "next/server";
import { isAdminHost } from "@/lib/admin/host";
import { hasSameOrigin } from "@/lib/admin/security";
import { requireAdminPermissionFromSession } from "@/lib/admin/authorization";
import { requireAdminSession } from "@/lib/admin/session";
import { adminErrorResponse } from "@/lib/admin/errors";
import { adminLessonSchema, adminStatusSchema } from "@/lib/admin/validation";
import { updateAdminLesson, setAdminLessonStatus } from "@/lib/admin/courses";
import { ProductStatus } from "@/lib/generated/prisma/enums";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) { if (!isAdminHost(request.headers.get("host"))) return NextResponse.json({ code: "NOT_FOUND", message: "یافت نشد." }, { status: 404 }); if (!hasSameOrigin(request)) return NextResponse.json({ code: "FORBIDDEN", message: "درخواست معتبر نیست." }, { status: 403 }); try { const session = await requireAdminSession(); requireAdminPermissionFromSession(session, "lessons.write"); const { id } = await params; const input = await request.json() as Record<string, unknown>; if (typeof input.status === "string") { const parsed = adminStatusSchema.parse(input); return NextResponse.json({ ok: true, message: "وضعیت درس تغییر کرد.", data: await setAdminLessonStatus(session.userId, id, parsed.status as ProductStatus, parsed.reason) }); } const parsed = adminLessonSchema.parse(input); return NextResponse.json({ ok: true, message: "درس ویرایش شد.", data: await updateAdminLesson(session.userId, id, parsed) }); } catch (error) { return adminErrorResponse(error); } }
