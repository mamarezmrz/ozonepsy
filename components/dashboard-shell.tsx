import Link from "next/link";

export function DashboardShell({ children, admin = false }: { children: React.ReactNode; admin?: boolean }) {
  const links = admin
    ? [["/admin", "نمای کلی"], ["/admin/users", "کاربران"], ["/admin/products", "محصولات"], ["/admin/orders", "سفارش‌ها"], ["/admin/sessions", "جلسات"], ["/admin/audit-logs", "گزارش فعالیت"]]
    : [["/dashboard", "نمای کلی"], ["/dashboard/profile", "اطلاعات شخصی"], ["/dashboard/sessions", "جلسات من"], ["/dashboard/courses", "دوره‌های من"], ["/dashboard/payments", "پرداخت‌ها"]];

  return (
    <div className="min-h-screen bg-[#fafcfc]">
      <aside className="fixed inset-y-0 right-0 hidden w-64 border-l border-[#e9eded] bg-white p-6 lg:block">
        <Link href="/" className="text-2xl font-black text-[#355859]">اُزون<span className="text-[#cc6f39]">.</span></Link>
        <div className="mt-10 grid gap-2">
          {links.map(([href, label]) => <Link key={href} href={href} className="rounded-xl px-4 py-3 text-sm font-bold text-[#676b6b] hover:bg-[#ebf7f7] hover:text-[#0f8b8d]">{label}</Link>)}
        </div>
        <Link href="/" className="absolute bottom-8 right-6 text-sm text-[#9b9e9e]">بازگشت به سایت</Link>
      </aside>

      <div className="lg:mr-64">
        <header className="border-b border-[#e9eded] bg-white">
          <div className="container-oz flex h-16 items-center justify-between">
            <div className="font-bold">{admin ? "مدیریت اُزون" : "حساب کاربری"}</div>
            <Link href="/" className="text-sm text-[#0f8b8d]">اُزون</Link>
          </div>
        </header>
        <nav className="page-breadcrumb" aria-label="مسیر صفحه">
          <div className="page-breadcrumb-inner container-oz"><Link href="/">خانه</Link><span aria-hidden="true">›</span><span aria-current="page">{admin ? "مدیریت اُزون" : "داشبورد"}</span></div>
        </nav>
        <nav className="flex gap-2 overflow-x-auto border-b border-[#e9eded] bg-white p-3 lg:hidden">
          {links.map(([href, label]) => <Link key={href} href={href} className="whitespace-nowrap rounded-lg bg-[#ebf7f7] px-3 py-2 text-xs font-bold">{label}</Link>)}
        </nav>
        <main className="container-oz py-8">{children}</main>
      </div>
    </div>
  );
}
