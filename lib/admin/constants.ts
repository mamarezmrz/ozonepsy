export const ADMIN_SESSION_COOKIE = "ozone_admin_session";
export const DEFAULT_ADMIN_SESSION_TTL_SECONDS = 8 * 60 * 60;
export const DEFAULT_ADMIN_IDLE_TTL_SECONDS = 30 * 60;
export const DEFAULT_ADMIN_LOGIN_RATE_LIMIT_MAX = 5;
export const DEFAULT_ADMIN_LOGIN_RATE_LIMIT_WINDOW_SECONDS = 15 * 60;

export const ADMIN_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "CONTENT_MANAGER",
  "SUPPORT",
  "INSTRUCTOR",
] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export const ADMIN_PERMISSION_KEYS = [
  "dashboard.view",
  "users.read",
  "users.update",
  "users.suspend",
  "products.read",
  "products.write",
  "courses.read",
  "courses.write",
  "courses.publish",
  "lessons.read",
  "lessons.write",
  "sessions.read",
  "sessions.manage",
  "reviews.read",
  "reviews.moderate",
  "content.read",
  "content.write",
  "media.read",
  "media.write",
  "reports.read",
  "audit.read",
  "admins.manage",
  "settings.manage",
] as const;

export type AdminPermissionKey = (typeof ADMIN_PERMISSION_KEYS)[number];
