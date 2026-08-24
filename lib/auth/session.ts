import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";

export const AUTH_SESSION_COOKIE = "ozone_session";
export const AUTH_SESSION_MAX_AGE = 60 * 60 * 24 * 30;

export function createSessionToken() {
  return randomBytes(32).toString("hex");
}

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();

  cookieStore.set({
    name: AUTH_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    maxAge: AUTH_SESSION_MAX_AGE,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function getSessionToken() {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_SESSION_COOKIE)?.value ?? null;
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_SESSION_COOKIE);
}
