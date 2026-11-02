import { requirePermission } from "@/lib/auth/server";
import { getAdminNotifications } from "@/lib/notifications/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requirePermission("orders.view");
  return Response.json(await getAdminNotifications(user.id), {
    headers: { "Cache-Control": "no-store" },
  });
}
