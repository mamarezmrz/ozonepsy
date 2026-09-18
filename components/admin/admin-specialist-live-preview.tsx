import { TherapistDetailPage } from "@/components/therapist-detail-page";
import type { PublicSpecialistProfile } from "@/lib/public/specialists";
import type { SpecialistProfileContentValues } from "@/components/admin/admin-specialist-profile-content";

type SpecialistPreviewValues = SpecialistProfileContentValues & {
  displayName?: string | null;
  specialty?: string | null;
  bio?: string | null;
  imageUrl?: string | null;
};

function previewImage(value?: string | null) {
  const image = value?.trim();
  if (!image) return "/ozone-logo.svg";
  if (image.startsWith("/") || image.startsWith("http://") || image.startsWith("https://")) return image;
  return `/figma-home/${image}`;
}

function toPreviewProfile(values: SpecialistPreviewValues): PublicSpecialistProfile {
  return {
    slug: "preview",
    name: values.displayName?.trim() || "نام متخصص",
    specialty: values.specialty?.trim() || "مشاور اُزون",
    bio: "",
    image: previewImage(values.imageUrl),
    aboutTitle: "",
    aboutDescription: "",
    specialtiesTitle: "",
    specialties: [],
    educationTitle: "",
    education: [],
    responsibilitiesTitle: "",
    responsibilities: [],
    booksTitle: "",
    books: [],
    quoteTitle: "",
    quote: "",
    sections: (values.profileSections ?? []).map((section) => ({ id: section.id, title: section.title, description: section.description })),
  };
}

export function AdminSpecialistLivePreview({ values }: { values: SpecialistPreviewValues }) {
  return (
    <aside className="admin-specialist-live-preview" aria-label="پیش‌نمایش زنده صفحه متخصص">
      <div className="admin-topic-live-preview-heading">
        <h2>پیش‌نمایش زنده</h2>
        <span>همان نمای صفحه عمومی متخصص</span>
      </div>
      <div className="admin-specialist-preview-scroll">
        <TherapistDetailPage profile={toPreviewProfile(values)} relatedProfiles={[]} showRelated={false} showPreconsultation={false} />
      </div>
    </aside>
  );
}
