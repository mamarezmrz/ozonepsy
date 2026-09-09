import { NextResponse } from "next/server";
import { isAdminHost } from "@/lib/admin/host";
import { hasSameOrigin } from "@/lib/admin/security";
import { requireAdminPermissionFromSession } from "@/lib/admin/authorization";
import { requireAdminSession } from "@/lib/admin/session";
import { adminErrorResponse } from "@/lib/admin/errors";
import { adminIndividualConsultationSchema } from "@/lib/admin/validation";
import { deleteAdminTherapyProduct, getAdminTherapyProduct, updateAdminIndividualConsultation } from "@/lib/admin/therapy-products";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Context) {
  if (!isAdminHost(request.headers.get("host"))) return NextResponse.json({ code: "NOT_FOUND", message: "یافت نشد." }, { status: 404 });
  try { const session = await requireAdminSession(); requireAdminPermissionFromSession(session, "products.read"); const { id } = await params; return NextResponse.json({ ok: true, data: await getAdminTherapyProduct("consultation", id) }); } catch (error) { return adminErrorResponse(error); }
}

export async function PATCH(request: Request, { params }: Context) {
  if (!isAdminHost(request.headers.get("host"))) return NextResponse.json({ code: "NOT_FOUND", message: "یافت نشد." }, { status: 404 });
  if (!hasSameOrigin(request)) return NextResponse.json({ code: "FORBIDDEN", message: "درخواست معتبر نیست." }, { status: 403 });
  try { const session = await requireAdminSession(); requireAdminPermissionFromSession(session, "products.write"); const input = adminIndividualConsultationSchema.parse(await request.json()); const { id } = await params; return NextResponse.json({ ok: true, message: "مشاوره فردی ویرایش شد.", data: await updateAdminIndividualConsultation(session.userId, id, input) }); } catch (error) { return adminErrorResponse(error); }
}

export async function DELETE(request: Request, { params }: Context) {
  if (!isAdminHost(request.headers.get("host"))) return NextResponse.json({ code: "NOT_FOUND", message: "یافت نشد." }, { status: 404 });
  if (!hasSameOrigin(request)) return NextResponse.json({ code: "FORBIDDEN", message: "درخواست معتبر نیست." }, { status: 403 });
  try { const session = await requireAdminSession(); requireAdminPermissionFromSession(session, "products.write"); const { id } = await params; return NextResponse.json({ ok: true, message: "مشاوره فردی حذف شد.", data: await deleteAdminTherapyProduct(session.userId, "consultation", id) }); } catch (error) { return adminErrorResponse(error); }
}
