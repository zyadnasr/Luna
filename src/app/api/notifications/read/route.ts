import { markNotificationRead } from "@/lib/notifications/actions";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { notificationId?: string } | null;
  if (!body?.notificationId) {
    return Response.json({ error: "Missing notification id" }, { status: 400 });
  }
  return Response.json(await markNotificationRead(body.notificationId));
}
