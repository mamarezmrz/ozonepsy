"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { DemoCheckoutProduct } from "@/lib/demo-payment";
import { formatDemoMoney } from "@/lib/payment-format";

type Props = {
  product: DemoCheckoutProduct;
  userEmail: string | null;
};

export function DemoCheckoutPage({ product, userEmail }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState(userEmail ?? "");
  const [cardholderName, setCardholderName] = useState("کاربر آزمایشی");
  const [cardNumber, setCardNumber] = useState("4242 4242 4242 4242");
  const [expiry, setExpiry] = useState("12/30");
  const [cvc, setCvc] = useState("123");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/payments/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, email, cardholderName, cardNumber, expiry, cvc }),
      });
      const body = (await response.json()) as { message?: string; orderNumber?: string };

      if (!response.ok || !body.orderNumber) {
        throw new Error(body.message ?? "پرداخت آزمایشی انجام نشد.");
      }

      router.push(`/payment/success?order=${encodeURIComponent(body.orderNumber)}`);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "خطایی رخ داد. دوباره تلاش کنید.");
      setIsSubmitting(false);
    }
  }

  return (
    <main className="demo-checkout-page">
      <div className="demo-checkout-inner">
        <div className="demo-checkout-badge">محیط آزمایشی · بدون برداشت وجه</div>
        <div className="demo-checkout-grid">
          <section className="demo-checkout-form-card" aria-labelledby="demo-checkout-title">
            <div className="demo-checkout-brand-row">
              <div>
                <span className="demo-checkout-overline">پرداخت امن اُزون</span>
                <h1 id="demo-checkout-title">تکمیل خرید</h1>
              </div>
              <div className="demo-checkout-card-brand" aria-label="پرداخت آزمایشی شبیه Stripe">stripe</div>
            </div>

            <p className="demo-checkout-description">
              اطلاعات زیر از قبل برای تست پر شده‌اند. این صفحه فقط برای شبیه‌سازی مسیر پرداخت است و هیچ مبلغی از شما کسر نمی‌شود.
            </p>

            <form className="demo-checkout-form" onSubmit={handleSubmit}>
              <label>
                ایمیل
                <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required readOnly={Boolean(userEmail)} />
              </label>
              <label>
                نام دارنده کارت
                <input value={cardholderName} onChange={(event) => setCardholderName(event.target.value)} required />
              </label>
              <label>
                شماره کارت آزمایشی
                <input value={cardNumber} onChange={(event) => setCardNumber(event.target.value)} inputMode="numeric" autoComplete="cc-number" required dir="ltr" />
              </label>
              <div className="demo-checkout-form-row">
                <label>
                  تاریخ انقضا
                  <input value={expiry} onChange={(event) => setExpiry(event.target.value)} placeholder="MM/YY" inputMode="numeric" autoComplete="cc-exp" required dir="ltr" />
                </label>
                <label>
                  CVC
                  <input value={cvc} onChange={(event) => setCvc(event.target.value)} inputMode="numeric" autoComplete="cc-csc" required dir="ltr" />
                </label>
              </div>

              {error && <p className="demo-checkout-error" role="alert">{error}</p>}

              <button className="demo-checkout-submit" type="submit" disabled={isSubmitting || !userEmail}>
                {isSubmitting ? "در حال تأیید..." : `پرداخت آزمایشی ${formatDemoMoney(product.priceMinor, product.currency)}`}
              </button>
              {!userEmail && <p className="demo-checkout-login-hint">برای خرید، ابتدا از طریق هدر وارد حساب کاربری شوید.</p>}
            </form>
          </section>

          <aside className="demo-checkout-summary" aria-label="خلاصه سفارش">
            <div className={`demo-checkout-summary-art bg-gradient-to-br ${product.accent}`}>
              <span>{product.kind === "course" ? "COURSE" : product.kind === "group" ? "GROUP" : "SESSION"}</span>
            </div>
            <span className="demo-checkout-summary-label">خلاصه سفارش</span>
            <h2>{product.title}</h2>
            <p>{product.description}</p>
            {product.duration && <div className="demo-checkout-summary-meta">{product.duration}</div>}
            <div className="demo-checkout-summary-total">
              <span>مبلغ نهایی</span>
              <strong>{formatDemoMoney(product.priceMinor, product.currency)}</strong>
            </div>
            <div className="demo-checkout-security">🔒 پرداخت رمزنگاری‌شده آزمایشی</div>
          </aside>
        </div>
      </div>
    </main>
  );
}
