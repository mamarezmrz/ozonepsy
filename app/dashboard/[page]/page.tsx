import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { GroupTherapyDashboardPage } from "@/components/group-therapy-dashboard-page";
import { IndividualSessionsPage } from "@/components/individual-sessions-page";
import { UserProfilePage } from "@/components/user-profile-page";
import { UserDashboardShell } from "@/components/user-dashboard";
import { getCurrentUser } from "@/lib/auth/service";
import { getDashboardData } from "@/lib/dashboard";
import { getUserProfile } from "@/lib/profile";
import { createPageMetadata } from "@/lib/seo";

const titles: Record<string, string> = {
  profile: "مشخصات من",
  sessions: "جلسات فردی",
  courses: "دوره‌های من",
  payments: "پرداخت‌ها",
  "group-therapy": "گروه درمانی",
  comments: "نظرات من",
  "support-fund": "صندوق حمایت",
  orders: "سفارش‌ها",
  appointments: "قرارهای من",
};

export async function generateMetadata({ params }: { params: Promise<{ page: string }> }): Promise<Metadata> {
  const { page } = await params;
  return createPageMetadata(titles[page] ?? "حساب کاربری");
}

export default async function DashboardSection({ params }: { params: Promise<{ page: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { page } = await params;
  const title = titles[page] ?? "حساب کاربری";
  const data = await getDashboardData(user.id);

  if (page === "profile") {
    const profile = await getUserProfile(user.id);
    if (!profile) redirect("/login");

    return (
      <UserDashboardShell data={data} activeHref="/dashboard/profile" title={title} className="is-profile-page">
        <UserProfilePage profile={profile} />
      </UserDashboardShell>
    );
  }

  if (page === "sessions") {
    return (
      <UserDashboardShell data={data} activeHref="/dashboard/sessions" title={title}>
        <IndividualSessionsPage />
      </UserDashboardShell>
    );
  }

  if (page === "group-therapy") {
    return (
      <UserDashboardShell data={data} activeHref="/dashboard/group-therapy" title={title}>
        <GroupTherapyDashboardPage groups={data.groupTherapy} />
      </UserDashboardShell>
    );
  }

  return (
    <UserDashboardShell data={data} activeHref={`/dashboard/${page}`} title={title}>
      <div className="user-dashboard-content">
        <section className="user-dashboard-panel user-dashboard-placeholder-panel">
          <h1>{title}</h1>
        </section>
      </div>
    </UserDashboardShell>
  );
}
