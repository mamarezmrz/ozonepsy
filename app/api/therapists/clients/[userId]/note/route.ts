import { z } from "zod";
import { requireTherapist, TherapistAuthorizationError } from "@/lib/auth/therapist";
import { hasSameOrigin } from "@/lib/security/request";
import { adminErrorResponse } from "@/lib/admin/errors";
import { prisma } from "@/lib/prisma";
import { getTherapistClients } from "@/lib/therapist/dashboard";

const noteSchema = z.object({ body: z.string().trim().max(10000, "یادداشت بیش از حد طولانی است.") });

export const runtime = "nodejs";

export async function PATCH(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  if (!hasSameOrigin(request)) return Response.json({ ok: false, message: "درخواست معتبر نیست." }, { status: 403 });
  try {
    const therapist = await requireTherapist();
    const { userId } = await params;
    if (!z.string().uuid().safeParse(userId).success) return Response.json({ ok: false, message: "مراجع معتبر نیست." }, { status: 400 });
    const client = (await getTherapistClients()).find((row) => row.id === userId);
    if (!client) return Response.json({ ok: false, message: "این مراجع به شما مرتبط نیست." }, { status: 403 });
    const input = noteSchema.parse(await request.json());
    if (!input.body) {
      await prisma.specialistClientNote.deleteMany({ where: { specialistId: therapist.specialist.id, userId } });
      return Response.json({ ok: true, message: "یادداشت مراجع پاک شد." });
    }
    await prisma.specialistClientNote.upsert({
      where: { specialistId_userId: { specialistId: therapist.specialist.id, userId } },
      create: { specialistId: therapist.specialist.id, userId, body: input.body },
      update: { body: input.body },
    });
    return Response.json({ ok: true, message: "یادداشت مراجع ذخیره شد." });
  } catch (error) {
    if (error instanceof TherapistAuthorizationError) return Response.json({ ok: false, message: error.message }, { status: error.code === "FORBIDDEN" ? 403 : 401 });
    return adminErrorResponse(error);
  }
}
