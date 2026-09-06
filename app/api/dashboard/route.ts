import { getCurrentUser } from "@/lib/auth/service";
import { getDashboardData } from "@/lib/dashboard";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return Response.json(
      { ok: false, error: "برای مشاهده داشبورد وارد حساب خود شوید." },
      { status: 401, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  try {
    const data = await getDashboardData(user.id);
    return Response.json({ ok: true, data }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return Response.json(
      { ok: false, error: "در حال حاضر دریافت اطلاعات داشبورد امکان‌پذیر نیست." },
      { status: 500, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
