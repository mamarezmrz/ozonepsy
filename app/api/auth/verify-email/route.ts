import { NextResponse } from "next/server";
import { PasswordResetError, verifyEmail } from "@/lib/auth/recovery";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (!token) return NextResponse.redirect(new URL("/login?verified=error", request.url));

  try {
    await verifyEmail(token);
    return NextResponse.redirect(new URL("/login?verified=success", request.url));
  } catch (error) {
    if (error instanceof PasswordResetError) {
      return NextResponse.redirect(new URL("/login?verified=error", request.url));
    }
    return NextResponse.redirect(new URL("/login?verified=error", request.url));
  }
}
