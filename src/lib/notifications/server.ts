import { createServiceClient } from "@/lib/supabase/service";
import type { OrderStatus } from "@/types/orders";

export type NotificationKind = "order_created" | "order_status_changed";

type OrderNotificationInput = {
  orderId: string;
  orderNumber: string;
  trackingToken: string;
  status: OrderStatus;
  kind: NotificationKind;
};

export type StoredNotification = {
  id: string;
  kind: NotificationKind;
  payload: { orderNumber?: string; status?: OrderStatus };
  createdAt: string;
  read: boolean;
};

export async function createOrderNotifications(input: OrderNotificationInput) {
  try {
    const service = createServiceClient();
    const payload = { orderNumber: input.orderNumber, status: input.status };
    const { error } = await service.from("notifications").insert([
      {
        audience: "admin",
        order_id: input.orderId,
        kind: input.kind,
        payload,
      },
      {
        audience: "customer",
        order_id: input.orderId,
        tracking_token: input.trackingToken,
        kind: input.kind,
        payload,
      },
    ]);
    if (error) console.error("Order notification creation failed", error);
  } catch (error) {
    console.error("Order notification setup failed", error);
  }
}

export async function getAdminNotifications(userId: string): Promise<StoredNotification[]> {
  const supabase = createServiceClient();
  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, kind, payload, created_at")
    .eq("audience", "admin")
    .is("recipient_user_id", null)
    .order("created_at", { ascending: false })
    .limit(30);
  if (!notifications?.length) return [];

  const ids = notifications.map((notification) => notification.id);
  const { data: reads } = await supabase
    .from("notification_reads")
    .select("notification_id")
    .eq("user_id", userId)
    .in("notification_id", ids);
  const readIds = new Set((reads ?? []).map((read) => read.notification_id));
  return notifications.map((notification) => ({
    id: notification.id,
    kind: notification.kind as NotificationKind,
    payload: notification.payload as StoredNotification["payload"],
    createdAt: notification.created_at,
    read: readIds.has(notification.id),
  }));
}

export async function getPublicNotifications(orderNumber: string, token: string) {
  const service = createServiceClient();
  const { data: order } = await service
    .from("orders")
    .select("id")
    .eq("order_number", orderNumber)
    .eq("status_lookup_token", token)
    .maybeSingle();
  if (!order) return [];
  const { data } = await service
    .from("notifications")
    .select("id, kind, payload, created_at")
    .eq("audience", "customer")
    .eq("order_id", order.id)
    .eq("tracking_token", token)
    .order("created_at", { ascending: false })
    .limit(20);
  return (data ?? []).map((notification) => ({
    id: notification.id,
    kind: notification.kind as NotificationKind,
    payload: notification.payload as StoredNotification["payload"],
    createdAt: notification.created_at,
  }));
}
