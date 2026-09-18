import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/auth/session";
import { authenticateGoogleUser, GoogleAuthError } from "@/lib/auth/google";
import { getRequestMetadata } from "@/lib/security/request";
import { AuthConflictError, InvalidCredentialsError } from "@/lib/auth/service";

export const runtime = "nodejs";

function redirectWithError(request: Request, code: string, intent: "login" | "signup" = "signup") {
  return NextResponse.redirect(new URL(`/${intent}?error=${encodeURIComponent(code)}`, request.url));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieStore = await cookies();
  const intent = cookieStore.get("ozone_google_oauth_intent")?.value === "login" ? "login" : "signup";
  const expectedState = cookieStore.get("ozone_google_oauth_state")?.value;
  cookieStore.delete("ozone_google_oauth_state");
  cookieStore.delete("ozone_google_oauth_intent");
  if (!code || !state || !expectedState || state !== expectedState) return redirectWithError(request, "google-invalid-state", intent);

  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return redirectWithError(request, "google-not-configured", intent);

  const redirectUri = process.env.GOOGLE_REDIRECT_URI?.trim() || new URL("/api/auth/google/callback", request.url).toString();
  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: "authorization_code" }),
      cache: "no-store",
    });
    if (!tokenResponse.ok) return redirectWithError(request, "google-token-failed", intent);
    const tokens = await tokenResponse.json() as { access_token?: string };
    if (!tokens.access_token) return redirectWithError(request, "google-token-failed", intent);

    const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { Authorization: `Bearer ${tokens.access_token}` }, cache: "no-store" });
    if (!profileResponse.ok) return redirectWithError(request, "google-profile-failed", intent);
    const profile = await profileResponse.json() as { sub?: string; email?: string; email_verified?: boolean; name?: string; given_name?: string; family_name?: string };
    const result = await authenticateGoogleUser({ subject: profile.sub ?? "", email: profile.email ?? "", emailVerified: profile.email_verified === true, name: profile.name, givenName: profile.given_name, familyName: profile.family_name }, getRequestMetadata(request));
    await setSessionCookie(result.token);
    return NextResponse.redirect(new URL("/", request.url));
  } catch (error) {
    if (error instanceof GoogleAuthError || error instanceof InvalidCredentialsError || error instanceof AuthConflictError) return redirectWithError(request, "google-account-not-available", intent);
    return redirectWithError(request, "google-failed", intent);
  }
}
