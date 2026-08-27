"use client";

import { useState, type FormEvent } from "react";
import { SiteNotification } from "@/components/site-notification";

type DashboardSupportFundPageProps = {
  totalMinor: number;
};

function formatAmount(totalMinor: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(totalMinor / 100);
}

export function DashboardSupportFundPage({ totalMinor }: DashboardSupportFundPageProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    tone: "success" | "error";
  } | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotification(null);
    setIsSubmitting(true);

    try {
      const form = new FormData(event.currentTarget);
      const response = await fetch("/api/support-fund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          donorName: form.get("donorName"),
          amount: form.get("amount"),
        }),
      });
      const result = (await response.json()) as { message?: string; error?: string };

      if (!response.ok) {
        setNotification({
          message: result.error ?? "اطلاعات واردشده را بررسی کنید.",
          tone: "error",
        });
        return;
      }

      setNotification({
        message: result.message ?? "درخواست حمایت شما ثبت شد.",
        tone: "success",
      });
      event.currentTarget.reset();
    } catch {
      setNotification({
        message: "ارتباط با سرور برقرار نشد. دوباره تلاش کنید.",
        tone: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {notification ? (
        <SiteNotification
          message={notification.message}
          tone={notification.tone}
          onDismiss={() => setNotification(null)}
        />
      ) : null}

      <div className="user-dashboard-content dashboard-support-fund-page-content">
        <section
          className="user-dashboard-panel dashboard-support-fund-panel"
          aria-labelledby="dashboard-support-fund-title"
        >
          <h1 id="dashboard-support-fund-title">صندوق حمایت</h1>

          <div className="dashboard-support-fund-body">
            <p className="dashboard-support-fund-total">
              مجموع حمایت شما: <strong dir="ltr">${formatAmount(totalMinor)}</strong>
            </p>
            <p className="dashboard-support-fund-description">
              توضیح در مورد صندوق حمایت و این‌که واریزهای انجام‌شده در بخش پرداخت‌ها ذخیره خواهند شد.
            </p>

            <form className="dashboard-support-fund-form" noValidate onSubmit={handleSubmit}>
              <label htmlFor="dashboard-support-fund-amount">مبلغ حمایت خود را وارد کنید</label>
              <div className="dashboard-support-fund-amount-field">
                <span aria-hidden="true">$</span>
                <input
                  id="dashboard-support-fund-amount"
                  name="amount"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  required
                  dir="ltr"
                />
              </div>

              <label htmlFor="dashboard-support-fund-donor-name">نام (اختیاری)</label>
              <input
                id="dashboard-support-fund-donor-name"
                name="donorName"
                autoComplete="name"
              />

              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "لطفاً صبر کنید" : "ثبت مبلغ حمایت"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </>
  );
}
