import { getPublicNotifications } from "@/lib/notifications/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderNumber: string }> },
) {
  const { orderNumber } = await params;
  const token = new URL(request.url).searchParams.get("token") ?? "";
  if (!token) return Response.json({ error: "Missing tracking token" }, { status: 400 });
  const notifications = await getPublicNotifications(orderNumber, token);
  return Response.json(notifications, { headers: { "Cache-Control": "no-store" } });
}
