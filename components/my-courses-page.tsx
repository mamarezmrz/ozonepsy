import { DashboardCourseCard } from "@/components/user-dashboard";
import Link from "next/link";
import type { DashboardCard } from "@/lib/dashboard";

function EmptyCoursesState() {
  return (
    <div className="my-courses-empty-state">
      <h2>تا کنون دوره‌ای خریداری نکرده‌اید!</h2>
      <p>برای شروع می‌توانید یکی از دوره‌های روانشناسی را خریداری کنید.</p>
      <div className="my-courses-empty-actions">
        <Link href="/free-session" className="my-courses-primary-button">پیش مشاوره رایگان</Link>
        <Link href="/courses" className="my-courses-secondary-button">مشاهده دوره‌ها</Link>
      </div>
    </div>
  );
}

export function MyCoursesPage({ courses }: { courses: DashboardCard[] }) {
  const visibleCourses = courses;

  return (
    <div className="user-dashboard-content my-courses-page-content">
      <section className={`user-dashboard-panel my-courses-panel${visibleCourses.length ? " is-populated" : " is-empty-panel"}`}>
        <header className="my-courses-heading">
          <h1>دوره‌های من</h1>
        </header>

        {visibleCourses.length > 0 ? (
          <div className="user-dashboard-course-list my-courses-list">
            {visibleCourses.map((course) => <DashboardCourseCard key={course.id} card={course} />)}
          </div>
        ) : (
          <EmptyCoursesState />
        )}
      </section>
    </div>
  );
}
