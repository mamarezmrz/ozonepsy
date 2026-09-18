import { NextResponse } from "next/server";
import { hasSameOrigin } from "@/lib/security/request";
import { requireAdminPermissionFromSession } from "@/lib/admin/authorization";
import { requireAdminSession } from "@/lib/admin/session";
import { adminErrorResponse } from "@/lib/admin/errors";
import { getAdminIndividualConsultationCases, saveAdminIndividualConsultationCases } from "@/lib/admin/individual-consultation-content";
import { adminIndividualConsultationCasesSchema } from "@/lib/admin/validation";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await requireAdminSession();
    requireAdminPermissionFromSession(session, "content.read");
    return NextResponse.json({ ok: true, data: await getAdminIndividualConsultationCases() });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  if (!hasSameOrigin(request)) return NextResponse.json({ code: "FORBIDDEN", message: "درخواست معتبر نیست." }, { status: 403 });
  try {
    const session = await requireAdminSession();
    requireAdminPermissionFromSession(session, "content.write");
    const input = adminIndividualConsultationCasesSchema.parse(await request.json());
    await saveAdminIndividualConsultationCases(session, input);
    return NextResponse.json({ ok: true, message: "سکشن‌های مشکلات حوزه‌های مشاوره با موفقیت ذخیره شدند." });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
