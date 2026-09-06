import Image from "next/image";
import Link from "next/link";
import { AboutPreconsultation } from "@/components/about-page";
import type { PublicSpecialistProfile } from "@/lib/public/specialists";

function ProfileSection({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="therapist-profile-section" aria-labelledby={`therapist-${title}`}>
      <h2 id={`therapist-${title}`}>{title}</h2>
      <ul>
        {items.map((item, index) => <li key={`${title}-${index}`}>{item}</li>)}
      </ul>
    </section>
  );
}

export function TherapistDetailPage({ profile, relatedProfiles = [] }: { profile: PublicSpecialistProfile; relatedProfiles?: PublicSpecialistProfile[] }) {

  return (
    <main className="therapist-detail-page">
      <div className="therapist-detail-inner">
        <Link href="/partners" className="therapist-back-button focus-ring" aria-label="بازگشت به همکاران اُزون">
          <span className="therapist-back-chevron" aria-hidden="true" />
        </Link>

        <section className="therapist-detail-hero" aria-labelledby="therapist-detail-title">
          <div className="therapist-detail-copy">
            <h1 id="therapist-detail-title">{profile.name}</h1>
            <p>{profile.specialty}</p>
            <Link href="/free-session" className="therapist-cta">پیش مشاوره رایگان</Link>
          </div>
          <figure className="therapist-detail-image">
            <Image src={profile.image} alt={profile.name} width={1080} height={1620} priority quality={100} unoptimized={profile.image.startsWith("http")} sizes="(max-width: 900px) 100vw, 360px" />
          </figure>
        </section>

        <div className="therapist-divider" />

        <div className="therapist-profile-content">
          <ProfileSection title="حوزه‌های تخصصی" items={profile.specialties} />
          <ProfileSection title="سوابق علمی" items={profile.education} />
          <ProfileSection title="مسئولیتهای علمی و اجرایی" items={profile.responsibilities} />
          <ProfileSection title="کتابها" items={profile.books} />

          <section className="therapist-quote" aria-labelledby="therapist-quote-title">
            <svg className="therapist-quote-mark" width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M9.84251 16.7787C13.5838 12.7227 19.2452 10.6667 26.6665 10.6667H29.3332V18.1841L27.1892 18.6134C23.5358 19.3441 20.9945 20.7814 19.6345 22.8907C18.9247 24.027 18.5222 25.3282 18.4665 26.6667H26.6665C27.3738 26.6667 28.052 26.9477 28.5521 27.4478C29.0522 27.9479 29.3332 28.6262 29.3332 29.3334V48.0001C29.3332 50.9414 26.9412 53.3334 23.9998 53.3334H7.99984C7.2926 53.3334 6.61432 53.0525 6.11422 52.5524C5.61413 52.0523 5.33317 51.374 5.33317 50.6667V37.3334L5.34117 29.5494C5.31717 29.2534 4.81051 22.2401 9.84251 16.7787ZM53.3332 53.3334H37.3332C36.6259 53.3334 35.9477 53.0525 35.4476 52.5524C34.9475 52.0523 34.6665 51.374 34.6665 50.6667V37.3334L34.6745 29.5494C34.6505 29.2534 34.1438 22.2401 39.1758 16.7787C42.9172 12.7227 48.5785 10.6667 55.9998 10.6667H58.6665V18.1841L56.5225 18.6134C52.8692 19.3441 50.3278 20.7814 48.9678 22.8907C48.258 24.027 47.8555 25.3282 47.7998 26.6667H55.9998C56.7071 26.6667 57.3854 26.9479 57.8855 27.4478C58.3856 27.9479 58.6665 28.6262 58.6665 29.3334V48.0001C58.6665 50.9414 56.2745 53.3334 53.3332 53.3334Z" fill="#73BEBF" />
            </svg>
            <h2 id="therapist-quote-title">سخنی با درمان‌جو</h2>
            <p>{profile.quote}</p>
          </section>
        </div>
      </div>

      <section className="therapist-related" aria-labelledby="therapist-related-title">
        <div className="therapist-related-inner">
          <h2 id="therapist-related-title">درمانگران با تخصص مشابه</h2>
          <div className="therapist-related-grid">
            {relatedProfiles.map((related) => (
              <Link key={related.slug} href={`/therapists/${related.slug}`} className="therapist-related-card focus-ring">
                <span className="therapist-related-photo">
                  <Image src={related.image} alt={related.name} fill unoptimized={related.image.startsWith("http")} sizes="(max-width: 560px) 35vw, 164px" />
                </span>
                <span className="therapist-related-name">{related.name}</span>
                <span className="therapist-related-specialty">{related.specialty}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <AboutPreconsultation />
    </main>
  );
}
