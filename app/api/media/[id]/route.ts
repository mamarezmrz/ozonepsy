import { NextResponse } from "next/server";
import { MediaStatus, MediaVisibility } from "@/lib/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { getMediaStorage } from "@/lib/media/storage";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const media = await prisma.mediaAsset.findFirst({ where: { id, status: MediaStatus.ACTIVE, visibility: MediaVisibility.PUBLIC }, select: { storageKey: true, mimeType: true, originalName: true } });
    if (!media) return new NextResponse(null, { status: 404 });
    const body = await getMediaStorage().get(media.storageKey);
    if (!body) return new NextResponse(null, { status: 404 });
    return new NextResponse(body as BodyInit, { status: 200, headers: { "Content-Type": media.mimeType, "Content-Length": String(body.byteLength), "Content-Disposition": `inline; filename="${media.originalName.replace(/["\r\n]/g, "")}"`, "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400", "X-Content-Type-Options": "nosniff" } });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
