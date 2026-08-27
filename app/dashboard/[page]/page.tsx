import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { GroupTherapyDashboardPage } from "@/components/group-therapy-dashboard-page";
import { IndividualSessionsPage } from "@/components/individual-sessions-page";
import { MyCoursesPage } from "@/components/my-courses-page";
import { PaymentsPage } from "@/components/payments-page";
import { CommentsPage } from "@/components/comments-page";
import { DashboardSupportFundPage } from "@/components/dashboard-support-fund-page";
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

  if (page === "courses") {
    return (
      <UserDashboardShell data={data} activeHref="/dashboard/courses" title={title}>
        <MyCoursesPage courses={data.courses} />
      </UserDashboardShell>
    );
  }

  if (page === "payments") {
    return (
      <UserDashboardShell data={data} activeHref="/dashboard/payments" title={title} className="is-payments-page">
        <PaymentsPage payments={data.payments} />
      </UserDashboardShell>
    );
  }

  if (page === "comments") {
    return (
      <UserDashboardShell data={data} activeHref="/dashboard/comments" title={title} className="is-comments-page">
        <CommentsPage />
      </UserDashboardShell>
    );
  }

  if (page === "support-fund") {
    return (
      <UserDashboardShell
        data={data}
        activeHref="/dashboard/support-fund"
        title={title}
        className="is-support-fund-page"
      >
        <DashboardSupportFundPage totalMinor={data.supportFundTotalMinor} />
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
