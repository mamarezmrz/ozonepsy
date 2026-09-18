import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";

export const AUTH_SESSION_COOKIE = "ozone_session";
export const THERAPIST_SESSION_COOKIE = "ozone_therapist_session";
export const AUTH_SESSION_MAX_AGE = 60 * 60 * 24 * 30;

export function createSessionToken() {
  return randomBytes(32).toString("hex");
}

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function setNamedSessionCookie(name: string, token: string) {
  const cookieStore = await cookies();

  cookieStore.set({
    name,
    value: token,
    httpOnly: true,
    maxAge: AUTH_SESSION_MAX_AGE,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function setSessionCookie(token: string) {
  await setNamedSessionCookie(AUTH_SESSION_COOKIE, token);
}

export async function setTherapistSessionCookie(token: string) {
  await setNamedSessionCookie(THERAPIST_SESSION_COOKIE, token);
}

export async function getSessionToken() {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_SESSION_COOKIE)?.value ?? null;
}

export async function getTherapistSessionToken() {
  const cookieStore = await cookies();
  return cookieStore.get(THERAPIST_SESSION_COOKIE)?.value ?? null;
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_SESSION_COOKIE);
}

export async function clearTherapistSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(THERAPIST_SESSION_COOKIE);
}
