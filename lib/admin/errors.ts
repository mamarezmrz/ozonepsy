import { NextResponse } from "next/server";
import { AdminAuthorizationError } from "@/lib/admin/authorization";
import { z } from "zod";

export type AdminErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

export class AdminServiceError extends Error {
  constructor(
    public readonly code: Exclude<AdminErrorCode, "UNAUTHORIZED" | "FORBIDDEN" | "INTERNAL_ERROR">,
    message: string,
    public readonly fieldErrors?: Record<string, string>,
  ) {
    super(message);
  }
}

function isCode(value: unknown): value is AdminErrorCode {
  return value === "UNAUTHORIZED" || value === "FORBIDDEN" || value === "NOT_FOUND" || value === "VALIDATION_ERROR" || value === "CONFLICT" || value === "RATE_LIMITED" || value === "INTERNAL_ERROR";
}

export function adminErrorResponse(error: unknown) {
  if (error instanceof AdminAuthorizationError) {
    return NextResponse.json(
      { code: error.code, message: error.code === "FORBIDDEN" ? "مجوز لازم برای این عملیات را ندارید." : "برای ادامه وارد پنل مدیریت شوید." },
      { status: error.code === "FORBIDDEN" ? 403 : 401 },
    );
  }

  if (error instanceof AdminServiceError) {
    const status = error.code === "NOT_FOUND" ? 404 : error.code === "CONFLICT" ? 409 : error.code === "RATE_LIMITED" ? 429 : 400;
    return NextResponse.json({ code: error.code, message: error.message, fieldErrors: error.fieldErrors }, { status });
  }

  if (error instanceof z.ZodError) {
    const fieldErrors = Object.fromEntries(error.issues.map((issue) => [issue.path.join(".") || "form", issue.message]));
    return NextResponse.json({ code: "VALIDATION_ERROR", message: "اطلاعات واردشده معتبر نیست.", fieldErrors }, { status: 400 });
  }

  const code = typeof error === "object" && error !== null && "code" in error && isCode(error.code) ? error.code : "INTERNAL_ERROR";
  return NextResponse.json({ code, message: "خطایی در پردازش درخواست رخ داد." }, { status: 500 });
}
