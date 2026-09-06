import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not configured.");
}

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: databaseUrl });
  return new PrismaClient({ adapter });
}

function isCurrentPrismaClient(client: PrismaClient | undefined): client is PrismaClient {
  if (!client) return false;

  // A dev server can keep the previous singleton alive across a Prisma Client
  // regeneration. Detect that stale instance before using a newly generated
  // model delegate such as consultationBenefitsSection.
  const candidate = client as PrismaClient & { consultationBenefitsSection?: unknown; individualConsultationCaseSection?: unknown; individualConsultationTopic?: unknown };
  return typeof candidate.consultationBenefitsSection !== "undefined"
    && typeof candidate.individualConsultationCaseSection !== "undefined"
    && typeof candidate.individualConsultationTopic !== "undefined";
}

export const prisma = isCurrentPrismaClient(globalForPrisma.prisma)
  ? globalForPrisma.prisma
  : createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
