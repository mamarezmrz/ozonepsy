import { getCurrentUser } from "@/lib/auth/service";
import { SiteFooter, SiteHeader as SiteHeaderClient } from "@/components/site-header";

export async function SiteHeader() {
  const user = await getCurrentUser();
  return <SiteHeaderClient initialAuthenticated={Boolean(user)} />;
}

export { SiteFooter };
