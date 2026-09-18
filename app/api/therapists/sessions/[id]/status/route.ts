import { z } from "zod";
import { AppointmentStatus } from "@/lib/generated/prisma/enums";
import { requireTherapist, TherapistAuthorizationError } from "@/lib/auth/therapist";
import { hasSameOrigin } from "@/lib/security/request";
import { adminErrorResponse } from "@/lib/admin/errors";
import { transitionTherapistAppointment } from "@/lib/therapist/sessions";

const statusSchema = z.object({
  status: z.enum([AppointmentStatus.COMPLETED, AppointmentStatus.CANCELED, AppointmentStatus.NO_SHOW]),
});

export const runtime = "nodejs";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasSameOrigin(request)) return Response.json({ ok: false, message: "درخواست معتبر نیست." }, { status: 403 });
  try {
    const therapist = await requireTherapist();
    const input = statusSchema.parse(await request.json());
    const { id } = await params;
    const data = await transitionTherapistAppointment(therapist.userId, therapist.specialist.id, id, input.status as AppointmentStatus);
    return Response.json({ ok: true, data, message: "وضعیت جلسه با موفقیت تغییر کرد." });
  } catch (error) {
    if (error instanceof TherapistAuthorizationError) return Response.json({ ok: false, message: error.message }, { status: error.code === "FORBIDDEN" ? 403 : 401 });
    return adminErrorResponse(error);
  }
}
