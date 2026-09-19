import { requireTherapist, TherapistAuthorizationError } from "@/lib/auth/therapist";
import { hasSameOrigin } from "@/lib/security/request";
import { adminErrorResponse } from "@/lib/admin/errors";
import { therapistProfileSchema, updateTherapistProfile } from "@/lib/therapist/profile";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  if (!hasSameOrigin(request)) return Response.json({ ok: false, message: "درخواست معتبر نیست." }, { status: 403 });
  try {
    const therapist = await requireTherapist();
    const contentType = request.headers.get("content-type") ?? "";
    let input: unknown;
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const text = (name: string) => {
        const value = form.get(name);
        return typeof value === "string" ? value : "";
      };
      input = {
        displayName: text("displayName"),
        email: text("email"),
        specialty: text("specialty"),
        phone: text("phone"),
        country: text("country"),
      };
    } else {
      input = await request.json();
    }
    const parsedInput = therapistProfileSchema.parse(input);
    const data = await updateTherapistProfile(therapist.userId, therapist.specialist.id, parsedInput);
    return Response.json({ ok: true, data, message: "اطلاعات پروفایل برای بررسی مدیریت ارسال شد؛ پس از تأیید، تغییرات در پروفایل عمومی نمایش داده می‌شود." });
  } catch (error) {
    if (error instanceof TherapistAuthorizationError) return Response.json({ ok: false, message: error.message }, { status: error.code === "FORBIDDEN" ? 403 : 401 });
    return adminErrorResponse(error);
  }
}
