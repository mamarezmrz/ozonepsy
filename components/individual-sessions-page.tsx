"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toPersianDigits } from "@/lib/format";

type SessionTab = "upcoming" | "completed";

export type IndividualSessionItem = {
  id: string;
  date: string;
  time: string;
  therapist: string;
  dateTime?: string;
};

function SessionsCreditCard({ total, completed, remaining }: { total: number; completed: number; remaining: number }) {
  return (
    <aside className="individual-sessions-credit-card">
      <h2>وضعیت اعتبار</h2>
      <dl>
        <div>
          <dt>مجموع جلسات خریداری‌شده</dt>
          <dd>{toPersianDigits(total)}</dd>
        </div>
        <div>
          <dt>مجموع جلسات انجام‌شده</dt>
          <dd>{toPersianDigits(completed)}</dd>
        </div>
        <div>
          <dt>جلسات باقی‌مانده</dt>
          <dd>{toPersianDigits(remaining)}</dd>
        </div>
      </dl>
      <p className={remaining === 0 ? "is-insufficient" : ""}>
        {remaining === 0
          ? "برای شرکت در جلسه نیاز است که هزینه‌ی جلسه قبل را پرداخت کنید. برای این کار می‌توانید یکی از پکیج‌های جلسات فردی را خریداری کنید."
          : "می‌توانید هزینه‌ی این جلسه را بعد از انجام شدن پرداخت کنید."}
      </p>
      <Link href="/consultations" className="individual-sessions-buy-button">خرید پکیج</Link>
    </aside>
  );
}

function SessionCard({ session, selected }: { session: IndividualSessionItem; selected: boolean }) {
  return (
    <article className={`individual-session-card${selected ? " is-selected" : ""}`}>
      <div className="individual-session-card-topline">
        <time dateTime={session.dateTime}>{toPersianDigits(session.date)}</time>
        <time>{toPersianDigits(session.time)}</time>
      </div>
      <p>{session.therapist}</p>
    </article>
  );
}

function EmptySessionsState() {
  return (
    <div className="individual-sessions-empty-state">
      <Image src="/illustrations/individual-sessions-empty.svg" alt="" width={288} height={287} />
      <h2>تا کنون جلسه‌ی فردی نداشته‌اید!</h2>
      <p>برای شروع جلسات می‌توانید ابتدا یک جلسه پیش مشاوره رایگان انجام دهید.</p>
      <div className="individual-sessions-empty-actions">
        <Link href="/free-session" className="individual-sessions-primary-button">پیش مشاوره رایگان</Link>
        <Link href="/consultations/individual" className="individual-sessions-secondary-button">صفحه جلسات فردی</Link>
      </div>
    </div>
  );
}

export function IndividualSessionsPage({
  sessionsByTab = { upcoming: [], completed: [] },
  credit,
}: {
  sessionsByTab?: Record<SessionTab, IndividualSessionItem[]>;
  credit?: { total: number; completed: number; remaining: number };
}) {
  const [activeTab, setActiveTab] = useState<SessionTab>("upcoming");
  const sessions = sessionsByTab[activeTab];

  return (
    <div className="user-dashboard-content individual-sessions-page-content">
      <section className={`user-dashboard-panel individual-sessions-panel${credit ? "" : " is-empty-panel"}`}>
        <div className="individual-sessions-page-heading">
          <h1>جلسات فردی</h1>
        </div>

        <div className={`individual-sessions-layout${credit ? "" : " is-empty"}`}>
          {credit ? <SessionsCreditCard {...credit} /> : null}

          <div className="individual-sessions-main">
            <div className="individual-sessions-tabs" role="tablist" aria-label="جلسات فردی">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "upcoming"}
                className={activeTab === "upcoming" ? "is-active" : ""}
                onClick={() => setActiveTab("upcoming")}
              >
                جلسات آینده
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "completed"}
                className={activeTab === "completed" ? "is-active" : ""}
                onClick={() => setActiveTab("completed")}
              >
                جلسات برگزار شده
              </button>
            </div>

            {sessions.length ? (
              <div className="individual-sessions-card-grid">
                {sessions.map((session, index) => (
                  <SessionCard key={`${activeTab}-${session.id}`} session={session} selected={activeTab === "upcoming" && index === 0} />
                ))}
              </div>
            ) : (
              <EmptySessionsState />
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
