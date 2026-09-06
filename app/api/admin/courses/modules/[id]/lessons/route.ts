import { NextResponse } from "next/server";
import { isAdminHost } from "@/lib/admin/host";
import { hasSameOrigin } from "@/lib/admin/security";
import { requireAdminPermissionFromSession } from "@/lib/admin/authorization";
import { requireAdminSession } from "@/lib/admin/session";
import { adminErrorResponse } from "@/lib/admin/errors";
import { adminLessonSchema, adminReorderSchema } from "@/lib/admin/validation";
import { createAdminLesson, reorderAdminLessons } from "@/lib/admin/courses";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { if (!isAdminHost(request.headers.get("host"))) return NextResponse.json({ code: "NOT_FOUND", message: "یافت نشد." }, { status: 404 }); if (!hasSameOrigin(request)) return NextResponse.json({ code: "FORBIDDEN", message: "درخواست معتبر نیست." }, { status: 403 }); try { const session = await requireAdminSession(); requireAdminPermissionFromSession(session, "lessons.write"); const input = await request.json(); const { id } = await params; if (Array.isArray(input?.ids)) return NextResponse.json({ ok: true, message: "ترتیب درس‌ها ذخیره شد.", data: await reorderAdminLessons(session.userId, id, adminReorderSchema.parse(input).ids, session) }); const parsed = adminLessonSchema.parse(input); return NextResponse.json({ ok: true, message: "درس ایجاد شد.", data: await createAdminLesson(session.userId, id, parsed, session) }, { status: 201 }); } catch (error) { return adminErrorResponse(error); } }
