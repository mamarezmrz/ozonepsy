import Image from "next/image";
import Link from "next/link";
import { DashboardLogout } from "@/components/dashboard-logout";
import { DashboardIcon, type DashboardIconName } from "@/components/dashboard-icons";
import { DashboardMobileMenu } from "@/components/dashboard-mobile-menu";
import { DashboardProductsScroll } from "@/components/dashboard-products-scroll";
import { LocalTime } from "@/components/local-time";
import { toPersianDigits } from "@/lib/format";
import type { DashboardCard, DashboardData, DashboardSession } from "@/lib/dashboard";

const menuItems = [
  ["/dashboard", "داشبورد", "dashboard"],
  ["/dashboard/profile", "مشخصات من", "profile"],
  ["/dashboard/sessions", "جلسات فردی", "sessions"],
  ["/dashboard/group-therapy", "گروه درمانی", "group"],
  ["/dashboard/courses", "دوره‌های من", "courses"],
  ["/dashboard/payments", "پرداخت‌ها", "payments"],
  ["/dashboard/comments", "نظرات من", "comments"],
  ["/dashboard/support-fund", "صندوق حمایت", "support"],
] as const satisfies ReadonlyArray<readonly [string, string, DashboardIconName]>;

function DashboardSidebar({ data, activeHref = "/dashboard" }: { data: DashboardData; activeHref?: string }) {
  return (
    <aside className="user-dashboard-sidebar">
      <div className="user-dashboard-profile-card">
        {data.profile.avatarUrl ? (
          <Image src={data.profile.avatarUrl} alt="" width={52} height={52} priority />
        ) : (
          <span className="user-dashboard-profile-avatar-placeholder" aria-hidden="true" />
        )}
        <div className="user-dashboard-profile-copy">
          <strong>{data.profile.name}</strong>
          <div className="user-dashboard-profile-meta-row">
            <div className="user-dashboard-profile-meta">
              <span>{data.profile.country || "کاربر اُزون"}</span>
            </div>
            <div className="user-dashboard-local-time">
              <span>زمان محلی</span>
              <LocalTime />
            </div>
          </div>
        </div>
      </div>

      <nav className="user-dashboard-nav" aria-label="منوی حساب کاربری">
        {menuItems.map(([href, label, icon]) => (
          <Link key={href} href={href} className={`user-dashboard-nav-link${href === activeHref ? " is-active" : ""}`}>
            <DashboardIcon name={icon} active={href === activeHref} />
            {label}
          </Link>
        ))}
      </nav>

      <DashboardMobileMenu items={menuItems} activeHref={activeHref} />

      <DashboardLogout />
    </aside>
  );
}

function PanelHeading({ title, href, linkLabel }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="user-dashboard-panel-heading">
      <h2>{title}</h2>
      {href && linkLabel ? <Link href={href}>{linkLabel}<span className="user-dashboard-arrow" aria-hidden="true" /></Link> : null}
    </div>
  );
}

function IndividualSessionCard({ session }: { session: DashboardSession }) {
  return (
    <article className="user-dashboard-session-card">
      <div className="user-dashboard-session-main user-dashboard-upcoming-main">
        <strong>جلسه پیش رو</strong>
        {session.nextAppointment ? <time>{session.nextAppointment}</time> : <small>هنوز جلسه‌ای زمان‌بندی نشده</small>}
      </div>
      <Link href={`/dashboard/entitlements/${session.id}`} className="user-dashboard-card-link">لینک جلسه<span className="user-dashboard-arrow" aria-hidden="true" /></Link>
    </article>
  );
}

function UsageCard({ session }: { session: DashboardSession }) {
  return (
    <article className="user-dashboard-usage-card">
      <div>
        <strong>اعتبار باقی‌مانده</strong>
        <b>{toPersianDigits(session.remaining)} جلسه</b>
      </div>
      <Link href="/consultations" className="user-dashboard-card-link">خرید پکیج<span className="user-dashboard-arrow" aria-hidden="true" /></Link>
    </article>
  );
}

export function DashboardCourseCard({ card }: { card: DashboardCard }) {
  return (
    <article className="home-course-card user-dashboard-course-card">
      <div className="home-course-info">
        <div>
          <h3>{card.title}</h3>
          <div className="home-course-tags" aria-label="دسته‌بندی دوره">
            <span className="home-course-tag">مشاوره فردی</span>
            <span className="home-course-tag">گروه درمانی</span>
          </div>
          <p>{card.description}</p>
        </div>
        <div className="home-course-footer">
          <div className="home-course-actions">
            <Link href={card.href} className="home-course-action home-course-action-secondary">جزئیات دوره</Link>
          </div>
        </div>
      </div>
      <div className="home-course-image">
        <Image src={card.image} alt="" fill sizes="(max-width: 600px) 132px, 150px" />
      </div>
    </article>
  );
}

function DashboardGroupCard({ card }: { card: DashboardCard }) {
  return (
    <article className="group-therapy-session-card">
      <div className="group-therapy-session-image">
        <Image src={card.image} alt="" fill sizes="(max-width: 600px) 146px, 180px" />
      </div>
      <div className="group-therapy-session-card-body">
        <h3>{card.title}</h3>
        <p>{card.description}</p>
        <Link href={card.href} className="group-therapy-session-link">مشاهده جزئیات<span aria-hidden="true" /></Link>
      </div>
    </article>
  );
}

function EmptyPanel({ title, linkLabel, href, message, className = "" }: { title: string; linkLabel?: string; href?: string; message: string; className?: string }) {
  return (
    <section className={`user-dashboard-panel user-dashboard-empty-panel ${className}`}>
      <PanelHeading title={title} href={href} linkLabel={linkLabel} />
      <p>{message}</p>
    </section>
  );
}

function EmptyDashboard() {
  return (
    <div className="user-dashboard-content user-dashboard-empty-content">
      <EmptyPanel title="جلسات فردی" href="/free-session" linkLabel="درخواست مشاوره رایگان" message="تا کنون جلسه فردی نداشته‌اید" className="user-dashboard-empty-sessions" />
      <div className="user-dashboard-empty-columns">
        <EmptyPanel title="گروه درمانی" href="/group-therapy" linkLabel="گروه درمانی" message="تا کنون جلسه‌ی گروه درمانی نداشته‌اید" />
        <EmptyPanel title="دوره‌های من" href="/courses" linkLabel="مشاهده‌ی دوره‌ها" message="تا کنون دوره‌ای خریداری نکرده‌اید" />
      </div>
      <EmptyPanel title="پرداخت‌های اخیر" message="تا کنون پرداختی نداشته‌اید" className="user-dashboard-empty-payments" />
    </div>
  );
}

function PopulatedDashboard({ data }: { data: DashboardData }) {
  const primarySession = data.individualSessions[0];

  return (
    <div className="user-dashboard-content">
      <section className="user-dashboard-panel user-dashboard-sessions-panel">
        <PanelHeading title="جلسات فردی" href="/dashboard/sessions" linkLabel="جزئیات بیشتر" />
        <div className="user-dashboard-session-grid">
          {primarySession ? <IndividualSessionCard session={primarySession} /> : <div className="user-dashboard-inline-empty">تا کنون جلسه‌ای نداشته‌اید</div>}
          {primarySession ? <UsageCard session={primarySession} /> : <div className="user-dashboard-inline-empty">اعتباری برای نمایش وجود ندارد</div>}
        </div>
      </section>

      <div className="user-dashboard-middle-grid">
        <section className="user-dashboard-panel user-dashboard-products-panel">
          <PanelHeading title="دوره‌های من" href="/dashboard/courses" linkLabel="جزئیات بیشتر" />
          {data.courses.length ? <DashboardProductsScroll listId="user-dashboard-courses-list" ariaLabel="پیمایش دوره‌های من" className="user-dashboard-course-list">{data.courses.map((card) => <DashboardCourseCard key={card.id} card={card} />)}</DashboardProductsScroll> : <div className="user-dashboard-inline-empty">تا کنون دوره‌ای خریداری نکرده‌اید</div>}
        </section>
        <section className="user-dashboard-panel user-dashboard-products-panel">
          <PanelHeading title="گروه درمانی" href="/dashboard/group-therapy" linkLabel="گروه درمانی" />
          {data.groupTherapy.length ? <DashboardProductsScroll listId="user-dashboard-group-therapy-list" ariaLabel="پیمایش گروه درمانی" className="user-dashboard-group-list" orientation="horizontal">{data.groupTherapy.map((card) => <DashboardGroupCard key={card.id} card={card} />)}</DashboardProductsScroll> : <div className="user-dashboard-inline-empty">تا کنون جلسه‌ی گروه درمانی نداشته‌اید</div>}
        </section>
      </div>

      <section className="user-dashboard-panel user-dashboard-payments-panel">
        <PanelHeading title="پرداخت‌های اخیر" href="/dashboard/payments" linkLabel="همه پرداخت‌ها" />
        <div className="user-dashboard-payment-table" role="table" aria-label="پرداخت‌های اخیر">
          <div className="user-dashboard-payment-row is-header" role="row"><span>شماره تراکنش</span><span>درگاه پرداخت</span><span>مبلغ پرداخت شده</span><span>تاریخ تراکنش</span><span>جزئیات خرید</span></div>
          {data.payments.map((payment) => <div className="user-dashboard-payment-row" role="row" key={payment.id}><span>{payment.orderNumber}</span><span>{payment.provider}</span><span>{payment.amount}</span><span>{payment.date}</span><span>{payment.productTitle}</span></div>)}
        </div>
      </section>
    </div>
  );
}

export function UserDashboardShell({
  data,
  activeHref = "/dashboard",
  title,
  className,
  children,
}: {
  data: DashboardData;
  activeHref?: string;
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <main className={`user-dashboard${className ? ` ${className}` : ""}`} dir="rtl">
      <div className="user-dashboard-layout">
        <section className="user-dashboard-main">
          <header className="user-dashboard-topbar">
            <div className="user-dashboard-breadcrumb"><span>پنل کاربری</span><span aria-hidden="true">›</span><span>{title}</span></div>
            <Link href="/" className="user-dashboard-return"><Image src="/ozone-logo.svg" alt="اُزون" width={42} height={42} loading="eager" /><span>بازگشت به وب‌سایت</span></Link>
          </header>
          {children}
        </section>
        <DashboardSidebar data={data} activeHref={activeHref} />
      </div>
    </main>
  );
}

export function UserDashboard({ data }: { data: DashboardData }) {
  const hasPurchases = data.individualSessions.length + data.groupTherapy.length + data.courses.length + data.payments.length > 0;

  return (
    <UserDashboardShell data={data} title="داشبورد">
      {hasPurchases ? <PopulatedDashboard data={data} /> : <EmptyDashboard />}
    </UserDashboardShell>
  );
}
