import { NextResponse } from "next/server";
import { isAdminHost } from "@/lib/admin/host";
import { hasSameOrigin } from "@/lib/admin/security";
import { requireAdminPermissionFromSession } from "@/lib/admin/authorization";
import { requireAdminSession } from "@/lib/admin/session";
import { adminErrorResponse } from "@/lib/admin/errors";
import { duplicateAdminCourse } from "@/lib/admin/courses";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { if (!isAdminHost(request.headers.get("host"))) return NextResponse.json({ code: "NOT_FOUND", message: "یافت نشد." }, { status: 404 }); if (!hasSameOrigin(request)) return NextResponse.json({ code: "FORBIDDEN", message: "درخواست معتبر نیست." }, { status: 403 }); try { const session = await requireAdminSession(); requireAdminPermissionFromSession(session, "courses.write"); const { id } = await params; return NextResponse.json({ ok: true, message: "نسخه پیش‌نویس ساخته شد.", data: await duplicateAdminCourse(session.userId, id, session) }, { status: 201 }); } catch (error) { return adminErrorResponse(error); } }
