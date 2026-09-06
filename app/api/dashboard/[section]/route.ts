import { getCurrentUser } from "@/lib/auth/service";
import { getDashboardData, type DashboardData } from "@/lib/dashboard";

export const runtime = "nodejs";

const sections = ["individualSessions", "groupTherapy", "courses", "payments"] as const;
type DashboardSection = (typeof sections)[number];

function isDashboardSection(value: string): value is DashboardSection {
  return sections.includes(value as DashboardSection);
}

export async function GET(_request: Request, { params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;

  if (!isDashboardSection(section)) {
    return Response.json(
      { ok: false, error: "بخش داشبورد پیدا نشد." },
      { status: 404, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  const user = await getCurrentUser();
  if (!user) {
    return Response.json(
      { ok: false, error: "برای مشاهده داشبورد وارد حساب خود شوید." },
      { status: 401, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  try {
    const data: DashboardData = await getDashboardData(user.id);
    return Response.json({ ok: true, data: data[section] }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return Response.json(
      { ok: false, error: "در حال حاضر دریافت اطلاعات داشبورد امکان‌پذیر نیست." },
      { status: 500, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
