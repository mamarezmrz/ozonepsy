import { NextResponse } from "next/server";
import { isAdminHost } from "@/lib/admin/host";
import { hasSameOrigin } from "@/lib/security/request";
import { requireAdminPermissionFromSession } from "@/lib/admin/authorization";
import { requireAdminSession } from "@/lib/admin/session";
import { adminErrorResponse } from "@/lib/admin/errors";
import { getAdminConsultationBenefits, saveAdminConsultationBenefits } from "@/lib/admin/consultation-benefits";
import { adminConsultationBenefitsSchema } from "@/lib/admin/validation";

export async function GET(request: Request) {
  if (!isAdminHost(request.headers.get("host"))) return NextResponse.json({ code: "NOT_FOUND", message: "یافت نشد." }, { status: 404 });
  try {
    const session = await requireAdminSession();
    requireAdminPermissionFromSession(session, "content.read");
    return NextResponse.json({ ok: true, data: await getAdminConsultationBenefits() });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  if (!isAdminHost(request.headers.get("host"))) return NextResponse.json({ code: "NOT_FOUND", message: "یافت نشد." }, { status: 404 });
  if (!hasSameOrigin(request)) return NextResponse.json({ code: "FORBIDDEN", message: "درخواست معتبر نیست." }, { status: 403 });
  try {
    const session = await requireAdminSession();
    requireAdminPermissionFromSession(session, "content.write");
    const input = adminConsultationBenefitsSchema.parse(await request.json());
    return NextResponse.json({ ok: true, data: await saveAdminConsultationBenefits(session, input) });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
