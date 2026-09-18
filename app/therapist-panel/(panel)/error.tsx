"use client";

export default function TherapistPanelError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="admin-page-stack"><section className="admin-panel-card therapist-error-card"><p className="admin-page-heading-eyebrow">خطای موقت</p><h1>امکان بارگذاری این بخش وجود ندارد.</h1><p>دوباره تلاش کنید؛ اگر مشکل ادامه داشت با مدیریت اُزون تماس بگیرید.</p><button type="button" className="admin-button admin-button-primary" onClick={reset}>تلاش دوباره</button></section></div>;
}
