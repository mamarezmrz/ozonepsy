import { AboutPreconsultation } from "@/components/about-page";
import { PartnersExpandableGrid, type PartnerItem } from "@/components/partners-expandable-grid";
import { institutionProfiles } from "@/lib/institutions";

const institutions: PartnerItem[] = institutionProfiles.map((profile) => ({
  name: profile.name,
  description: profile.specialty,
  image: `/figma-home/${profile.image}`,
  href: `/institutes/${profile.slug}`,
}));

export async function PartnersPage({ specialists }: { specialists: PartnerItem[] }) {
  return (
    <main className="partners-page">
      <div className="partners-page-inner">
        <section className="partners-intro" aria-labelledby="partners-page-title">
          <h1 id="partners-page-title">همکاران اُزون</h1>
          <p>پذیرا توسط برد تخصصی متشکل از اساتید روانشناسی ایران همچون دکتر جعفر بوالهری (ریاست اسبق انستیتو روانپزشکی تهران/ دانشگاه علوم پزشکی ایران)، دکتر فرشته موتابی (عضو هیئت علمی دانشگاه شهید بهشتی)، دکتر لادن فتی (عضو کمیته داوران کنگره جهانی درمان‌های شناختی-رفتاری)، دکتر شهریار شهیدی (مشاور رسمی منطقه ای سازمان ملل) و دکتر حمیدرضا رحمانیان (عضو کالج سلطنتی روانپزشکان انگلستان) صلاحیت مشاوران را تایید می‌کند.</p>
        </section>

        <PartnersExpandableGrid title="موسسات همکار" items={institutions} variant="institution" />
        <PartnersExpandableGrid title="مشاوران همکار" items={specialists} variant="therapist" />
      </div>

      <AboutPreconsultation />
    </main>
  );
}
