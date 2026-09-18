import { NextResponse } from "next/server";
import { hasSameOrigin } from "@/lib/security/request";
import { requireAdminPermissionFromSession } from "@/lib/admin/authorization";
import { requireAdminSession } from "@/lib/admin/session";
import { adminErrorResponse } from "@/lib/admin/errors";
import { updateAdminContent, setAdminContentStatus, deleteAdminFaq } from "@/lib/admin/content";
import { adminContentStatusSchema, adminFaqSchema, adminTestimonialSchema } from "@/lib/admin/validation";
import { ContentStatus } from "@/lib/generated/prisma/enums";

function contentType(value: string) { if (value === "faq" || value === "testimonials") return value === "faq" ? "faq" as const : "testimonial" as const; return null; }

export async function PATCH(request: Request, { params }: { params: Promise<{ type: string; id: string }> }) {
  if (!hasSameOrigin(request)) return NextResponse.json({ code: "FORBIDDEN", message: "درخواست معتبر نیست." }, { status: 403 });
  try { const session = await requireAdminSession(); requireAdminPermissionFromSession(session, "content.write"); const { type, id } = await params; const parsedType = contentType(type); if (!parsedType) return NextResponse.json({ code: "NOT_FOUND", message: "یافت نشد." }, { status: 404 }); const body = await request.json() as Record<string, unknown>; if (typeof body.status === "string") { const input = adminContentStatusSchema.parse(body); return NextResponse.json({ ok: true, data: await setAdminContentStatus(session, parsedType, id, input.status as ContentStatus, input.reason) }); } const input = parsedType === "faq" ? adminFaqSchema.parse(body) : adminTestimonialSchema.parse(body); return NextResponse.json({ ok: true, data: await updateAdminContent(session, parsedType, id, input) }); } catch (error) { return adminErrorResponse(error); }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ type: string; id: string }> }) {
  if (!hasSameOrigin(request)) return NextResponse.json({ code: "FORBIDDEN", message: "درخواست معتبر نیست." }, { status: 403 });
  try {
    const session = await requireAdminSession();
    requireAdminPermissionFromSession(session, "content.write");
    const { type, id } = await params;
    if (type !== "faq") return NextResponse.json({ code: "NOT_FOUND", message: "یافت نشد." }, { status: 404 });
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return NextResponse.json({ code: "NOT_FOUND", message: "سوال متداول پیدا نشد." }, { status: 404 });
    const data = await deleteAdminFaq(session, id);
    return NextResponse.json({ ok: true, message: "سوال متداول حذف شد.", data });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
