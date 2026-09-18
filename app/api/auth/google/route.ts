import { NextResponse } from "next/server";
import { createSessionToken } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const intent = new URL(request.url).searchParams.get("intent") === "login" ? "login" : "signup";
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  if (!clientId) return NextResponse.redirect(new URL(`/${intent}?error=google-not-configured`, request.url));

  const state = createSessionToken();
  const redirectUri = process.env.GOOGLE_REDIRECT_URI?.trim() || new URL("/api/auth/google/callback", request.url).toString();
  const authorizationUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authorizationUrl.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  }).toString();

  const response = NextResponse.redirect(authorizationUrl);
  response.cookies.set({
    name: "ozone_google_oauth_state",
    value: state,
    httpOnly: true,
    maxAge: 10 * 60,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  response.cookies.set({
    name: "ozone_google_oauth_intent",
    value: intent,
    httpOnly: true,
    maxAge: 10 * 60,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
