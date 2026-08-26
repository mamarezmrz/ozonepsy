"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { DashboardGroupTherapyCard } from "@/lib/dashboard";

const mockGroupTherapyCards: DashboardGroupTherapyCard[] = [
  {
    id: "mock-group-therapy-1",
    title: "آشنایی با طرحواره ۱",
    description: "در این جلسات با مفاهیم پایه طرحواره‌ها آشنا می‌شوید و برای شناخت الگوهای فکری خود قدم برمی‌دارید.",
    image: "/figma-home/image-21.png",
    href: "/group-therapy/schema-therapy-1",
    sessions: [
      { id: "mock-group-therapy-1-session-1", title: "جلسه ۱", date: "۲۳ ژانویه ۲۰۲۶", time: "ساعت ۱۴:۳۰", completed: true },
      { id: "mock-group-therapy-1-session-2", title: "جلسه ۲", date: "۳۰ ژانویه ۲۰۲۶", time: "ساعت ۱۴:۳۰", completed: true },
      { id: "mock-group-therapy-1-session-3", title: "جلسه ۳", date: "۶ فوریه ۲۰۲۶", time: "ساعت ۱۴:۳۰", completed: false },
      { id: "mock-group-therapy-1-session-4", title: "جلسه ۴", date: "۱۳ فوریه ۲۰۲۶", time: "ساعت ۱۴:۳۰", completed: false },
    ],
  },
  {
    id: "mock-group-therapy-2",
    title: "آشنایی با طرحواره ۲",
    description: "با همراهی گروه و درمانگر، مهارت‌های ارتباطی و راهکارهای کاربردی برای تغییر الگوهای رفتاری را تمرین می‌کنید.",
    image: "/figma-home/image-21.png",
    href: "/group-therapy/communication-skills",
    sessions: [
      { id: "mock-group-therapy-2-session-1", title: "جلسه ۱", date: "۲۵ فوریه ۲۰۲۶", time: "ساعت ۱۶:۰۰", completed: true },
      { id: "mock-group-therapy-2-session-2", title: "جلسه ۲", date: "۴ مارس ۲۰۲۶", time: "ساعت ۱۶:۰۰", completed: false },
      { id: "mock-group-therapy-2-session-3", title: "جلسه ۳", date: "۱۱ مارس ۲۰۲۶", time: "ساعت ۱۶:۰۰", completed: false },
    ],
  },
  {
    id: "mock-group-therapy-3",
    title: "گروه رشد و خودشناسی",
    description: "در فضایی امن و همراهانه، تجربه‌های خود را به اشتراک بگذارید و مسیر رشد فردی‌تان را با آگاهی بیشتری دنبال کنید.",
    image: "/figma-home/image-21.png",
    href: "/group-therapy/personal-growth",
    sessions: [
      { id: "mock-group-therapy-3-session-1", title: "جلسه ۱", date: "۱۸ مارس ۲۰۲۶", time: "ساعت ۱۸:۳۰", completed: false },
      { id: "mock-group-therapy-3-session-2", title: "جلسه ۲", date: "۲۵ مارس ۲۰۲۶", time: "ساعت ۱۸:۳۰", completed: false },
      { id: "mock-group-therapy-3-session-3", title: "جلسه ۳", date: "۱ آوریل ۲۰۲۶", time: "ساعت ۱۸:۳۰", completed: false },
    ],
  },
];

function EmptyGroupTherapyState() {
  return (
    <div className="group-therapy-dashboard-empty-state">
      <Image src="/illustrations/group-therapy-empty.svg" alt="" width={288} height={288} />
      <h2>تا کنون جلسه‌ی گروهی نداشته‌اید!</h2>
      <p>برای شروع جلسات گروهی می‌توانید ابتدا یک جلسه پیش مشاوره رایگان انجام دهید.</p>
      <div className="group-therapy-dashboard-empty-actions">
        <Link href="/free-session" className="group-therapy-dashboard-primary-button">پیش مشاوره رایگان</Link>
        <Link href="/group-therapy" className="group-therapy-dashboard-secondary-button">صفحه گروه درمانی</Link>
      </div>
    </div>
  );
}

function GroupTherapySessionRow({ session }: { session: DashboardGroupTherapyCard["sessions"][number] }) {
  return (
    <article className={`group-therapy-dashboard-session${session.completed ? " is-completed" : ""}`}>
      <span className="group-therapy-dashboard-session-title">
        {session.completed ? <span className="group-therapy-dashboard-session-check" aria-label="انجام شده" /> : null}
        {session.title}
      </span>
      <time>{session.date}</time>
      <span>{session.time}</span>
    </article>
  );
}

function GroupTherapyCard({ card, expanded, onToggle }: { card: DashboardGroupTherapyCard; expanded: boolean; onToggle: () => void }) {
  return (
    <article className="group-therapy-dashboard-card">
      <div className="group-therapy-dashboard-card-main">
        <div className="group-therapy-dashboard-card-image">
          <Image src={card.image} alt="" fill sizes="(max-width: 600px) 112px, 150px" />
        </div>
        <div className="group-therapy-dashboard-card-copy">
          <h2>{card.title}</h2>
          <p>{card.description}</p>
        </div>

        <div className="group-therapy-dashboard-card-actions">
          <Link href={card.href} className="group-therapy-dashboard-session-link">لینک جلسه</Link>
          <button type="button" className="group-therapy-dashboard-expand-button" aria-expanded={expanded} onClick={onToggle}>
            {expanded ? "بستن جلسات" : "مشاهده جلسات"}
            <span className={`group-therapy-dashboard-expand-icon${expanded ? " is-open" : ""}`} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className={`group-therapy-dashboard-expander${expanded ? " is-open" : ""}`} aria-hidden={!expanded}>
        <div className="group-therapy-dashboard-expander-inner">
          {card.sessions.length ? (
            <div className="group-therapy-dashboard-session-grid">
              {card.sessions.map((session) => <GroupTherapySessionRow key={session.id} session={session} />)}
            </div>
          ) : (
            <p className="group-therapy-dashboard-no-sessions">هنوز جلسه‌ای برای این گروه زمان‌بندی نشده است.</p>
          )}
        </div>
      </div>
    </article>
  );
}

export function GroupTherapyDashboardPage({ groups }: { groups: DashboardGroupTherapyCard[] }) {
  const visibleGroups = process.env.NODE_ENV === "development" && !groups.length
    ? mockGroupTherapyCards
    : groups;
  const [expandedId, setExpandedId] = useState<string | null>(visibleGroups[0]?.id ?? null);

  return (
    <div className="user-dashboard-content group-therapy-dashboard-page-content">
      <section className={`user-dashboard-panel group-therapy-dashboard-panel${visibleGroups.length ? " is-populated" : ""}`}>
        <header className="group-therapy-dashboard-heading">
          <h1>گروه درمانی</h1>
        </header>
        {visibleGroups.length ? (
          <div className="group-therapy-dashboard-card-list">
            {visibleGroups.map((card) => (
              <GroupTherapyCard
                key={card.id}
                card={card}
                expanded={expandedId === card.id}
                onToggle={() => setExpandedId((current) => current === card.id ? null : card.id)}
              />
            ))}
          </div>
        ) : <EmptyGroupTherapyState />}
      </section>
    </div>
  );
}
