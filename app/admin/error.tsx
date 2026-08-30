"use client";

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fafcfc] p-6" dir="rtl">
      <section className="w-full max-w-lg rounded-[28px] bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-[#db4244]">خطای غیرمنتظره</p>
        <h1 className="mt-3 text-2xl font-bold text-[#3b4040]">امکان بارگذاری پنل مدیریت وجود ندارد.</h1>
        <button type="button" onClick={reset} className="mt-6 rounded-[20px] bg-[#f0aa7e] px-6 py-3 text-[#3b4040] transition hover:bg-[#e99a69]">
          تلاش دوباره
        </button>
      </section>
    </main>
  );
}
