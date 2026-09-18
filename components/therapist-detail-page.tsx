import Image from "next/image";
import Link from "next/link";
import { AboutPreconsultation } from "@/components/about-page";
import type { PublicSpecialistProfile } from "@/lib/public/specialists";

function ProfileSection({ title, description }: { title: string; description: string }) {
  if (!title.trim() && !description.trim()) return null;
  return (
    <section className="therapist-profile-section" aria-labelledby={`therapist-${title}`}>
      {title.trim() ? <h2 id={`therapist-${title}`}>{title}</h2> : null}
      {description.trim() ? <p>{description}</p> : null}
    </section>
  );
}

export function TherapistDetailPage({ profile, relatedProfiles = [], showRelated = true, showPreconsultation = true }: { profile: PublicSpecialistProfile; relatedProfiles?: PublicSpecialistProfile[]; showRelated?: boolean; showPreconsultation?: boolean }) {
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
            <Image src={profile.image} alt={profile.name} width={1080} height={1620} priority quality={100} unoptimized={profile.image.startsWith("http") || profile.image.startsWith("blob:") || profile.image.startsWith("data:") || profile.image.startsWith("/api/")} sizes="(max-width: 900px) 100vw, 360px" />
          </figure>
        </section>

        <div className="therapist-divider" />

        <div className="therapist-profile-content">
          {profile.sections.map((section) => <ProfileSection key={section.id} title={section.title} description={section.description} />)}
        </div>
      </div>

      {showRelated && relatedProfiles.length ? <section className="therapist-related" aria-labelledby="therapist-related-title">
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
      </section> : null}

      {showPreconsultation ? <AboutPreconsultation /> : null}
    </main>
  );
}
