import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ status: "ok", service: "ozonepsy", database: "ok", timestamp: new Date().toISOString() });
  } catch {
    return Response.json({ status: "error", service: "ozonepsy", database: "unavailable", timestamp: new Date().toISOString() }, { status: 503 });
  }
}
