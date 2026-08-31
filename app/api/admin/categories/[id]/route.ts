import { NextResponse } from "next/server";
import { isAdminHost } from "@/lib/admin/host";
import { hasSameOrigin } from "@/lib/admin/security";
import { requireAdminPermissionFromSession } from "@/lib/admin/authorization";
import { requireAdminSession } from "@/lib/admin/session";
import { adminErrorResponse } from "@/lib/admin/errors";
import { adminCategorySchema, adminCategoryStatusSchema } from "@/lib/admin/validation";
import { updateAdminCategory, setAdminCategoryStatus } from "@/lib/admin/categories";
import { CategoryStatus } from "@/lib/generated/prisma/enums";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) { if (!isAdminHost(request.headers.get("host"))) return NextResponse.json({ code: "NOT_FOUND", message: "یافت نشد." }, { status: 404 }); if (!hasSameOrigin(request)) return NextResponse.json({ code: "FORBIDDEN", message: "درخواست معتبر نیست." }, { status: 403 }); try { const session = await requireAdminSession(); requireAdminPermissionFromSession(session, "categories.write"); const { id } = await params; const input = await request.json() as Record<string, unknown>; if (typeof input.status === "string") { const parsed = adminCategoryStatusSchema.parse(input); return NextResponse.json({ ok: true, message: "وضعیت دسته‌بندی تغییر کرد.", data: await setAdminCategoryStatus(session.userId, id, parsed.status === "ARCHIVED" ? CategoryStatus.ARCHIVED : CategoryStatus.ACTIVE, parsed.reason) }); } const parsed = adminCategorySchema.parse(input); return NextResponse.json({ ok: true, message: "دسته‌بندی ویرایش شد.", data: await updateAdminCategory(session.userId, id, parsed) }); } catch (error) { return adminErrorResponse(error); } }
