import { NextResponse } from "next/server";
import { isAdminHost } from "@/lib/admin/host";
import { hasSameOrigin } from "@/lib/security/request";
import { requireAdminPermissionFromSession } from "@/lib/admin/authorization";
import { requireAdminSession } from "@/lib/admin/session";
import { adminErrorResponse } from "@/lib/admin/errors";
import { archiveAdminIndividualConsultationTopic, getAdminIndividualConsultationTopic, parseConsultationCasesPageKey, saveAdminIndividualConsultationTopic } from "@/lib/admin/individual-consultation-content";
import { adminIndividualConsultationTopicSchema } from "@/lib/admin/validation";

export const runtime = "nodejs";

function notFound() {
  return NextResponse.json({ code: "NOT_FOUND", message: "یافت نشد." }, { status: 404 });
}

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (!isAdminHost(request.headers.get("host"))) return notFound();
  try {
    const session = await requireAdminSession();
    requireAdminPermissionFromSession(session, "content.read");
    const url = new URL(request.url);
    return NextResponse.json({ ok: true, data: await getAdminIndividualConsultationTopic((await params).slug, parseConsultationCasesPageKey(url.searchParams.get("pageKey"))) });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (!isAdminHost(request.headers.get("host"))) return notFound();
  if (!hasSameOrigin(request)) return NextResponse.json({ code: "FORBIDDEN", message: "درخواست معتبر نیست." }, { status: 403 });
  try {
    const session = await requireAdminSession();
    requireAdminPermissionFromSession(session, "content.write");
    const slug = (await params).slug;
    const url = new URL(request.url);
    const pageKey = parseConsultationCasesPageKey(url.searchParams.get("pageKey"));
    const input = adminIndividualConsultationTopicSchema.parse(await request.json());
    await saveAdminIndividualConsultationTopic(session, slug, pageKey, input);
    return NextResponse.json({ ok: true, message: "پیش‌نویس محتوای صفحه با موفقیت ذخیره شد." });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (!isAdminHost(request.headers.get("host"))) return notFound();
  if (!hasSameOrigin(request)) return NextResponse.json({ code: "FORBIDDEN", message: "درخواست معتبر نیست." }, { status: 403 });
  try {
    const session = await requireAdminSession();
    requireAdminPermissionFromSession(session, "content.write");
    const url = new URL(request.url);
    await archiveAdminIndividualConsultationTopic(session, (await params).slug, parseConsultationCasesPageKey(url.searchParams.get("pageKey")));
    return NextResponse.json({ ok: true, message: "محتوای صفحه حذف شد." });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
