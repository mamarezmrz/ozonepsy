import { getCurrentUser } from "@/lib/auth/service";
import { SiteFooter, SiteHeader as SiteHeaderClient } from "@/components/site-header";
import { getSiteHeaderUser } from "@/lib/auth/user-display";

export async function SiteHeader({ showBreadcrumb = true }: { showBreadcrumb?: boolean } = {}) {
  const user = await getCurrentUser();
  const initialUser = user ? getSiteHeaderUser(user.email, user.profile?.displayName, user.profile?.avatarUrl) : null;

  return <SiteHeaderClient key={initialUser ? `${initialUser.label}:${initialUser.avatarUrl ?? ""}` : "logged-out"} initialUser={initialUser} showBreadcrumb={showBreadcrumb} />;
}

export { SiteFooter };
