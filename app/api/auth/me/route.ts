import { getCurrentUser } from "@/lib/auth/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();

  return Response.json(
    {
      authenticated: Boolean(user),
      user,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
