import { NextResponse } from "next/server";
import { z } from "zod";
import { hasSameOrigin } from "@/lib/admin/security";
import { requireAdminPermissionFromSession } from "@/lib/admin/authorization";
import { requireAdminSession } from "@/lib/admin/session";
import { adminErrorResponse } from "@/lib/admin/errors";
import { updateAdminPreconsultationRequestStatus } from "@/lib/admin/preconsultation-requests";
import { PreconsultationRequestStatus } from "@/lib/generated/prisma/enums";

const schema = z.object({ status: z.enum([PreconsultationRequestStatus.PENDING, PreconsultationRequestStatus.CONTACTED, PreconsultationRequestStatus.COMPLETED]) });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasSameOrigin(request)) return NextResponse.json({ code: "FORBIDDEN", message: "درخواست نامعتبر است." }, { status: 403 });
  try {
    const session = await requireAdminSession();
    requireAdminPermissionFromSession(session, "users.update");
    const { id } = await params;
    const input = schema.parse(await request.json());
    const data = await updateAdminPreconsultationRequestStatus(id, session.userId, input.status);
    return NextResponse.json({ ok: true, message: "وضعیت درخواست به‌روزرسانی شد.", data });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
