import { getPublicOrderStatus } from "@/lib/orders/actions";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderNumber: string }> },
) {
  const { orderNumber } = await params;
  const token = new URL(request.url).searchParams.get("token");
  if (!token) return Response.json({ error: "Missing tracking token" }, { status: 400 });

  const order = await getPublicOrderStatus(orderNumber, token);
  if (!order) return Response.json({ error: "Order not found" }, { status: 404 });
  return Response.json(order, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
