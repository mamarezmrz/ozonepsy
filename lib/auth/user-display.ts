import type { SiteHeaderUser } from "@/types/site-header";

export function getSiteHeaderUser(
  email: string,
  displayName?: string | null,
  avatarUrl?: string | null,
): SiteHeaderUser {
  const name = displayName?.trim();
  const emailPrefix = email.split("@", 1)[0]?.trim();

  return {
    label: name || emailPrefix || email,
    avatarUrl: avatarUrl ?? null,
  };
}
