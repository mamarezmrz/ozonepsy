import { NextResponse } from "next/server";
import { isAdminHost } from "@/lib/admin/host";
import { hasSameOrigin } from "@/lib/security/request";
import { requireAdminPermissionFromSession } from "@/lib/admin/authorization";
import { requireAdminSession } from "@/lib/admin/session";
import { adminErrorResponse } from "@/lib/admin/errors";
import { listAdminContent, createAdminContent } from "@/lib/admin/content";
import { parseAdminListQuery } from "@/lib/admin/query";
import { adminFaqSchema, adminTestimonialSchema } from "@/lib/admin/validation";
import { ContentStatus } from "@/lib/generated/prisma/enums";

function contentType(value: string) { if (value === "faq" || value === "testimonials") return value === "faq" ? "faq" as const : "testimonial" as const; return null; }

export async function GET(request: Request, { params }: { params: Promise<{ type: string }> }) {
  if (!isAdminHost(request.headers.get("host"))) return NextResponse.json({ code: "NOT_FOUND", message: "یافت نشد." }, { status: 404 });
  try { const session = await requireAdminSession(); requireAdminPermissionFromSession(session, "content.read"); const type = contentType((await params).type); if (!type) return NextResponse.json({ code: "NOT_FOUND", message: "یافت نشد." }, { status: 404 }); const url = new URL(request.url); const query = parseAdminListQuery(url.searchParams, ["sortOrder", "status"]); const value = url.searchParams.get("status"); const status = Object.values(ContentStatus).includes(value as ContentStatus) ? value as ContentStatus : undefined; return NextResponse.json({ ok: true, data: await listAdminContent(type, query, status) }); } catch (error) { return adminErrorResponse(error); }
}

export async function POST(request: Request, { params }: { params: Promise<{ type: string }> }) {
  if (!isAdminHost(request.headers.get("host"))) return NextResponse.json({ code: "NOT_FOUND", message: "یافت نشد." }, { status: 404 });
  if (!hasSameOrigin(request)) return NextResponse.json({ code: "FORBIDDEN", message: "درخواست معتبر نیست." }, { status: 403 });
  try { const session = await requireAdminSession(); requireAdminPermissionFromSession(session, "content.write"); const type = contentType((await params).type); if (!type) return NextResponse.json({ code: "NOT_FOUND", message: "یافت نشد." }, { status: 404 }); const body = await request.json(); const input = type === "faq" ? adminFaqSchema.parse(body) : adminTestimonialSchema.parse(body); return NextResponse.json({ ok: true, data: await createAdminContent(session, type, input) }, { status: 201 }); } catch (error) { return adminErrorResponse(error); }
}
