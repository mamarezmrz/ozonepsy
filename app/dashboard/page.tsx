import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { UserDashboard } from "@/components/user-dashboard";
import { getCurrentUser } from "@/lib/auth/service";
import { getDashboardData } from "@/lib/dashboard";
import { createPageMetadata } from "@/lib/seo";
export const metadata: Metadata = createPageMetadata("داشبورد");
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const data = await getDashboardData(user.id);

  return <UserDashboard data={data} />;
}
