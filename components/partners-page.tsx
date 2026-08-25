import { AboutPreconsultation } from "@/components/about-page";
import { PartnersExpandableGrid, type PartnerItem } from "@/components/partners-expandable-grid";

const institutions: PartnerItem[] = [
  { name: "مرکز مشاوره همشهری", description: "مرکز مشاوره و خدمات روانشناختی", image: "partner-1.png" },
  { name: "مرکز مشاوره آسمان", description: "مرکز مشاوره و خدمات روانشناختی", image: "partner-2.png" },
  { name: "مرکز مشاوره آسمان", description: "مرکز مشاوره و خدمات روانشناختی", image: "partner-3.jpg" },
  { name: "مرکز مشاوره راه نو", description: "مرکز روانشناسی و مشاوره", image: "partner-4.png" },
  { name: "مرکز مشاوره خانواده", description: "مرکز مشاوره خانواده و روابط", image: "partner-5.png" },
  { name: "مرکز مشاوره آسمان", description: "مرکز مشاوره و خدمات روانشناختی", image: "partner-2.png" },
  { name: "مرکز مشاوره راه نو", description: "مرکز روانشناسی و مشاوره", image: "partner-4.png" },
  { name: "مرکز مشاوره خانواده", description: "مرکز مشاوره خانواده و روابط", image: "partner-5.png" },
];

const therapists: PartnerItem[] = [
  { name: "دکتر رضا مولودی", description: "کارشناس ارشد روانشناسی بالینی", image: "partner-6.jpg" },
  { name: "دکتر سارا مولودی", description: "کارشناس ارشد روانشناسی بالینی", image: "partner-7.jpg" },
  { name: "دکتر علی مولودی", description: "کارشناس ارشد روانشناسی بالینی", image: "partner-8.jpg" },
  { name: "دکتر محمد مولودی", description: "کارشناس ارشد روانشناسی بالینی", image: "partner-9.jpg" },
  { name: "دکتر نازنین مولودی", description: "کارشناس ارشد روانشناسی بالینی", image: "partner-10.jpg" },
  { name: "دکتر امیر مولودی", description: "کارشناس ارشد روانشناسی بالینی", image: "partner-11.jpg" },
  { name: "دکتر رضا مولودی", description: "کارشناس ارشد روانشناسی بالینی", image: "partner-6.jpg" },
  { name: "دکتر سارا مولودی", description: "کارشناس ارشد روانشناسی بالینی", image: "partner-7.jpg" },
  { name: "دکتر علی مولودی", description: "کارشناس ارشد روانشناسی بالینی", image: "partner-8.jpg" },
  { name: "دکتر محمد مولودی", description: "کارشناس ارشد روانشناسی بالینی", image: "partner-9.jpg" },
  { name: "دکتر نازنین مولودی", description: "کارشناس ارشد روانشناسی بالینی", image: "partner-10.jpg" },
];

export function PartnersPage() {
  return (
    <main className="partners-page">
      <div className="partners-page-inner">
        <section className="partners-intro" aria-labelledby="partners-page-title">
          <h1 id="partners-page-title">همکاران اُزون</h1>
          <p>پذیرا توسط برد تخصصی متشکل از اساتید روانشناسی ایران همچون دکتر جعفر بوالهری (ریاست اسبق انستیتو روانپزشکی تهران/ دانشگاه علوم پزشکی ایران)، دکتر فرشته موتابی (عضو هیئت علمی دانشگاه شهید بهشتی)، دکتر لادن فتی (عضو کمیته داوران کنگره جهانی درمان‌های شناختی-رفتاری)، دکتر شهریار شهیدی (مشاور رسمی منطقه ای سازمان ملل) و دکتر حمیدرضا رحمانیان (عضو کالج سلطنتی روانپزشکان انگلستان) صلاحیت مشاوران را تایید می‌کند.</p>
        </section>

        <PartnersExpandableGrid title="موسسات همکار" items={institutions} variant="institution" />
        <PartnersExpandableGrid title="مشاوران همکار" items={therapists} variant="therapist" />
      </div>

      <AboutPreconsultation />
    </main>
  );
}
