import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/service";
import { createDemoPurchase, DemoPaymentError } from "@/lib/demo-payment";
import { hasSameOrigin } from "@/lib/security/request";
import { isDemoPaymentEnabled } from "@/lib/payments/demo-gate";

export const runtime = "nodejs";

const paymentInputSchema = z.object({
  productId: z.string().min(1).max(120),
  email: z.string().email(),
  cardholderName: z.string().trim().min(2).max(120),
  cardNumber: z.string().regex(/^[\d\s-]{12,24}$/),
  expiry: z.string().regex(/^\d{2}\/\d{2}$/),
  cvc: z.string().regex(/^\d{3,4}$/),
});

export async function POST(request: Request) {
  if (!isDemoPaymentEnabled()) {
    return NextResponse.json({ code: "NOT_FOUND", message: "یافت نشد." }, { status: 404 });
  }
  if (!hasSameOrigin(request)) {
    return NextResponse.json({ code: "FORBIDDEN", message: "درخواست معتبر نیست." }, { status: 403 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ code: "UNAUTHORIZED", message: "برای تکمیل خرید ابتدا وارد حساب کاربری شوید." }, { status: 401 });
  }

  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ code: "VALIDATION_ERROR", message: "اطلاعات پرداخت معتبر نیست." }, { status: 400 });
  }

  const parsed = paymentInputSchema.safeParse(input);
  if (!parsed.success) {
    return NextResponse.json({ code: "VALIDATION_ERROR", message: "اطلاعات کارت را به‌درستی وارد کنید." }, { status: 400 });
  }
  if (parsed.data.email.trim().toLowerCase() !== user.email.toLowerCase()) {
    return NextResponse.json({ code: "FORBIDDEN", message: "ایمیل پرداخت باید با حساب کاربری شما یکسان باشد." }, { status: 403 });
  }

  const normalizedCardNumber = parsed.data.cardNumber.replace(/[\s-]/g, "");
  if (normalizedCardNumber === "4000000000000002") {
    return NextResponse.json({ code: "CONFLICT", message: "پرداخت آزمایشی توسط بانک رد شد. کارت دیگری را امتحان کنید." }, { status: 402 });
  }
  if (normalizedCardNumber !== "4242424242424242") {
    return NextResponse.json({ code: "VALIDATION_ERROR", message: "برای پرداخت آزمایشی از کارت 4242 4242 4242 4242 استفاده کنید." }, { status: 400 });
  }

  try {
    const purchase = await createDemoPurchase(user.id, parsed.data.productId);
    return NextResponse.json(purchase, { status: 201 });
  } catch (error) {
    if (error instanceof DemoPaymentError) {
      return NextResponse.json({ code: error.code, message: error.message }, { status: error.status });
    }
    console.error("Demo payment failed", error);
    return NextResponse.json({ code: "INTERNAL_ERROR", message: "پرداخت آزمایشی انجام نشد. دوباره تلاش کنید." }, { status: 500 });
  }
}
