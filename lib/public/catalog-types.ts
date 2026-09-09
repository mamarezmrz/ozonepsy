export type PublicProductKind = "consultation" | "package" | "group" | "course";

export type PublicPurchaseProduct = {
  id: string;
  slug: string;
  title: string;
  description: string;
  kind: PublicProductKind;
  category: string;
  tags: string[];
  priceMinor: number;
  currency: string;
  accent: string;
  label: string;
  duration?: string;
  sessions?: number;
};

export type PublicCourseLesson = {
  id: string;
  title: string;
  duration: number | null;
  isPreview: boolean;
  mediaUrl: string | null;
};

export type PublicCourseModule = {
  id: string;
  title: string;
  description: string | null;
  lessons: PublicCourseLesson[];
};

export type PublicCoursePage = PublicPurchaseProduct & {
  kind: "course";
  accessDays: number | null;
  deliveryMode: "RECORDED" | "LIVE";
  instructorName: string | null;
  coverUrl: string | null;
  demoVideoUrl: string | null;
  modules: PublicCourseModule[];
};

export type PublicGroupTherapyPage = PublicPurchaseProduct & {
  kind: "group";
  coverUrl: string | null;
  cohortLabel: string | null;
  capacity: number | null;
  schedulePolicy: string | null;
};
