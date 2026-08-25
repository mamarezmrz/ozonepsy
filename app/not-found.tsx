import Image from "next/image";
import Link from "next/link";
import { PageTitle } from "@/components/page-title";
import { SiteFooter, SiteHeader } from "@/components/site-header-server";

export default function NotFound() {
  return (
    <>
      <PageTitle title="صفحه پیدا نشد | اُزون" />
      <SiteHeader showBreadcrumb={false} />
      <main className="not-found-page">
        <div className="not-found-card container-oz">
          <div className="not-found-art" aria-hidden="true">
            <span className="not-found-halo not-found-halo-outer" />
            <span className="not-found-halo not-found-halo-middle" />
            <span className="not-found-halo not-found-halo-inner" />
            <Image src="/ozone-logo.svg" alt="اُزون" width={112} height={112} priority />
          </div>

          <div className="not-found-copy">
            <span className="not-found-code">۴۰۴</span>
            <h1>صفحه پیدا نشد</h1>
            <p>
              به نظر می‌رسد صفحه‌ای که به دنبال آن هستید وجود ندارد یا جابه‌جا شده است.
            </p>
            <div className="not-found-actions">
              <Link href="/" className="not-found-primary">بازگشت به خانه</Link>
              <Link href="/consultations" className="not-found-secondary">مشاهده حوزه‌های مشاوره</Link>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
