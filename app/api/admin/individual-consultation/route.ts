import { NextResponse } from "next/server";
import { isAdminHost } from "@/lib/admin/host";
import { hasSameOrigin } from "@/lib/admin/security";
import { requireAdminPermissionFromSession } from "@/lib/admin/authorization";
import { requireAdminSession } from "@/lib/admin/session";
import { adminErrorResponse } from "@/lib/admin/errors";
import { parseAdminListQuery } from "@/lib/admin/query";
import { adminIndividualConsultationSchema } from "@/lib/admin/validation";
import { createAdminIndividualConsultation, listAdminTherapyProducts } from "@/lib/admin/therapy-products";
import { ProductStatus } from "@/lib/generated/prisma/enums";

export async function GET(request: Request) {
  if (!isAdminHost(request.headers.get("host"))) return NextResponse.json({ code: "NOT_FOUND", message: "یافت نشد." }, { status: 404 });
  try { const session = await requireAdminSession(); requireAdminPermissionFromSession(session, "products.read"); const url = new URL(request.url); const query = parseAdminListQuery(url.searchParams, ["createdAt", "title", "status"]); const rawStatus = url.searchParams.get("status"); const status = Object.values(ProductStatus).includes(rawStatus as ProductStatus) ? rawStatus as ProductStatus : undefined; return NextResponse.json({ ok: true, data: await listAdminTherapyProducts("consultation", query, status) }); } catch (error) { return adminErrorResponse(error); }
}

export async function POST(request: Request) {
  if (!isAdminHost(request.headers.get("host"))) return NextResponse.json({ code: "NOT_FOUND", message: "یافت نشد." }, { status: 404 });
  if (!hasSameOrigin(request)) return NextResponse.json({ code: "FORBIDDEN", message: "درخواست معتبر نیست." }, { status: 403 });
  try { const session = await requireAdminSession(); requireAdminPermissionFromSession(session, "products.write"); const input = adminIndividualConsultationSchema.parse(await request.json()); return NextResponse.json({ ok: true, message: "مشاوره فردی ایجاد شد.", data: await createAdminIndividualConsultation(session.userId, input) }, { status: 201 }); } catch (error) { return adminErrorResponse(error); }
}
