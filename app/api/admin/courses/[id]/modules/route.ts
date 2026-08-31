import { NextResponse } from "next/server";
import { isAdminHost } from "@/lib/admin/host";
import { hasSameOrigin } from "@/lib/admin/security";
import { requireAdminPermissionFromSession } from "@/lib/admin/authorization";
import { requireAdminSession } from "@/lib/admin/session";
import { adminErrorResponse } from "@/lib/admin/errors";
import { adminModuleSchema, adminReorderSchema } from "@/lib/admin/validation";
import { createAdminModule, reorderAdminModules } from "@/lib/admin/courses";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { if (!isAdminHost(request.headers.get("host"))) return NextResponse.json({ code: "NOT_FOUND", message: "یافت نشد." }, { status: 404 }); if (!hasSameOrigin(request)) return NextResponse.json({ code: "FORBIDDEN", message: "درخواست معتبر نیست." }, { status: 403 }); try { const session = await requireAdminSession(); requireAdminPermissionFromSession(session, "lessons.write"); const input = await request.json(); const { id } = await params; if (Array.isArray(input?.ids)) return NextResponse.json({ ok: true, message: "ترتیب ماژول‌ها ذخیره شد.", data: await reorderAdminModules(session.userId, id, adminReorderSchema.parse(input).ids) }); const parsed = adminModuleSchema.parse(input); return NextResponse.json({ ok: true, message: "ماژول ایجاد شد.", data: await createAdminModule(session.userId, id, parsed.title, parsed.description) }, { status: 201 }); } catch (error) { return adminErrorResponse(error); } }
