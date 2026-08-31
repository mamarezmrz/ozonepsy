import { NextResponse } from "next/server";
import { isAdminHost } from "@/lib/admin/host";
import { hasSameOrigin } from "@/lib/admin/security";
import { requireAdminPermissionFromSession } from "@/lib/admin/authorization";
import { requireAdminSession } from "@/lib/admin/session";
import { adminErrorResponse } from "@/lib/admin/errors";
import { parseAdminListQuery } from "@/lib/admin/query";
import { adminCategorySchema } from "@/lib/admin/validation";
import { createAdminCategory, listAdminCategories } from "@/lib/admin/categories";

export async function GET(request: Request) { if (!isAdminHost(request.headers.get("host"))) return NextResponse.json({ code: "NOT_FOUND", message: "یافت نشد." }, { status: 404 }); try { const session = await requireAdminSession(); requireAdminPermissionFromSession(session, "categories.read"); const url = new URL(request.url); const query = parseAdminListQuery(url.searchParams, ["updatedAt", "title"]); return NextResponse.json({ ok: true, data: await listAdminCategories(query) }); } catch (error) { return adminErrorResponse(error); } }
export async function POST(request: Request) { if (!isAdminHost(request.headers.get("host"))) return NextResponse.json({ code: "NOT_FOUND", message: "یافت نشد." }, { status: 404 }); if (!hasSameOrigin(request)) return NextResponse.json({ code: "FORBIDDEN", message: "درخواست معتبر نیست." }, { status: 403 }); try { const session = await requireAdminSession(); requireAdminPermissionFromSession(session, "categories.write"); const input = adminCategorySchema.parse(await request.json()); return NextResponse.json({ ok: true, message: "دسته‌بندی ایجاد شد.", data: await createAdminCategory(session.userId, input) }, { status: 201 }); } catch (error) { return adminErrorResponse(error); } }
