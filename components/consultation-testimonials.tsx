"use client";

import Image from "next/image";
import { useState } from "react";
import { toPersianDigits } from "@/lib/format";

const testimonials = [
  ["علی", "profile-2.png", "من از مشاوره با آقای حسینی بسیار راضی هستم. او با دقت به مشکلات من گوش می‌دهد و همیشه راهکارهای مفیدی ارائه می‌کند. در هر جلسه احساس می‌کنم که پیشرفت بیشتری دارم و اعتماد به نفسم به‌طور قابل توجهی افزایش یافته است."],
  ["نرگس", "profile-3.png", "مشاوره به من کمک کرد با آرامش بیشتری با چالش‌های روزمره روبه‌رو شوم و مسیر تازه‌ای برای رشد خودم پیدا کنم. شنیده شدن و دریافت راهنمایی درست، تجربه‌ی ارزشمندی برای من بود."],
  ["حسین", "profile-4.png", "از روند جلسات و فضای امن گفت‌وگو رضایت دارم. در هر جلسه فرصت پیدا می‌کنم مسئله‌هایم را بهتر بشناسم و قدم‌های کوچک اما مؤثری بردارم."],
  ["مریم", "profile-5.png", "همراهی مشاور باعث شد تصمیم‌های مهم زندگی‌ام را آگاهانه‌تر بگیرم و در برخورد با احساساتم مهربان‌تر و دقیق‌تر باشم."],
  ["لیلا", "profile-1.png", "در طول جلسات یاد گرفتم نیازها و مرزهای خودم را بهتر بشناسم. این مسیر به من کمک کرد ارتباط سالم‌تری با خودم و اطرافیانم بسازم."],
  ["میلاد", "profile-2.png", "تجربه‌ی من از مشاوره فردی مثبت و کاربردی بود. حالا ابزارهای بیشتری برای مدیریت استرس و عبور از موقعیت‌های دشوار در اختیار دارم."],
] as const;

const initialVisibleCount = 4;

export function ConsultationTestimonials() {
  const [expanded, setExpanded] = useState(false);
  const visibleTestimonials = expanded ? testimonials : testimonials.slice(0, initialVisibleCount);
  const hiddenCount = testimonials.length - initialVisibleCount;

  return (
    <section className="consultation-testimonials" aria-labelledby="consultation-testimonials-title">
      <div className="consultation-testimonials-inner">
        <div className="consultation-testimonials-heading">
          <h2 id="consultation-testimonials-title">نظرات شما</h2>
          <p>تجربه همراهان اُزون از مسیر مشاوره و گفت‌وگو.</p>
        </div>
        <div className="consultation-testimonials-list">
          {visibleTestimonials.slice(0, initialVisibleCount).map(([name, avatar, text], index) => <TestimonialCard key={`${name}-${index}`} name={name} avatar={avatar} text={text} />)}
          <div className={`consultation-testimonials-extra${expanded ? " is-open" : ""}`} aria-hidden={!expanded}>
            {visibleTestimonials.slice(initialVisibleCount).map(([name, avatar, text], index) => <TestimonialCard key={`${name}-extra-${index}`} name={name} avatar={avatar} text={text} />)}
          </div>
        </div>
        <div className="consultation-testimonials-actions">
          <button type="button" className="consultation-testimonials-toggle" aria-expanded={expanded} onClick={() => setExpanded((current) => !current)}>
            <span>{expanded ? "بستن نظرات" : `مشاهده ${toPersianDigits(hiddenCount)} نظر دیگر`}</span>
            <span className={`consultation-testimonials-chevron${expanded ? " is-open" : ""}`} aria-hidden="true" />
          </button>
          <button type="button" className="consultation-new-review">ثبت نظر جدید</button>
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({ name, avatar, text }: { name: string; avatar: string; text: string }) {
  return <article className="consultation-testimonial-card"><div className="consultation-testimonial-top"><Image src={`/figma-home/${avatar}`} alt="" width={48} height={48} /><span>{name}</span></div><p>{text}</p></article>;
}
