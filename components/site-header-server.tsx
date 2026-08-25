import { getCurrentUser } from "@/lib/auth/service";
import { SiteFooter, SiteHeader as SiteHeaderClient } from "@/components/site-header";

export async function SiteHeader({ showBreadcrumb = true }: { showBreadcrumb?: boolean } = {}) {
  const user = await getCurrentUser();
  return <SiteHeaderClient initialAuthenticated={Boolean(user)} showBreadcrumb={showBreadcrumb} />;
}

export { SiteFooter };
