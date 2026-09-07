import { NextResponse } from "next/server";
import { isAdminHost } from "@/lib/admin/host";
import { hasSameOrigin } from "@/lib/admin/security";
import { requireAdminPermissionFromSession } from "@/lib/admin/authorization";
import { requireAdminSession } from "@/lib/admin/session";
import { adminErrorResponse } from "@/lib/admin/errors";
import { adminCourseCreateSchema } from "@/lib/admin/validation";
import { deleteAdminCourse, getAdminCourse, updateAdminCourse } from "@/lib/admin/courses";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) { if (!isAdminHost(request.headers.get("host"))) return NextResponse.json({ code: "NOT_FOUND", message: "یافت نشد." }, { status: 404 }); try { const session = await requireAdminSession(); requireAdminPermissionFromSession(session, "courses.read"); const { id } = await params; return NextResponse.json({ ok: true, data: await getAdminCourse(id, session) }); } catch (error) { return adminErrorResponse(error); } }
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) { if (!isAdminHost(request.headers.get("host"))) return NextResponse.json({ code: "NOT_FOUND", message: "یافت نشد." }, { status: 404 }); if (!hasSameOrigin(request)) return NextResponse.json({ code: "FORBIDDEN", message: "درخواست معتبر نیست." }, { status: 403 }); try { const session = await requireAdminSession(); requireAdminPermissionFromSession(session, "courses.write"); const input = adminCourseCreateSchema.parse(await request.json()); const { id } = await params; return NextResponse.json({ ok: true, message: "دوره ویرایش شد.", data: await updateAdminCourse(session.userId, id, input, session) }); } catch (error) { return adminErrorResponse(error); } }

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) { if (!isAdminHost(request.headers.get("host"))) return NextResponse.json({ code: "NOT_FOUND", message: "یافت نشد." }, { status: 404 }); if (!hasSameOrigin(request)) return NextResponse.json({ code: "FORBIDDEN", message: "درخواست معتبر نیست." }, { status: 403 }); try { const session = await requireAdminSession(); requireAdminPermissionFromSession(session, "courses.write"); const { id } = await params; return NextResponse.json({ ok: true, message: "دوره حذف شد.", data: await deleteAdminCourse(session.userId, id, session) }); } catch (error) { return adminErrorResponse(error); } }
