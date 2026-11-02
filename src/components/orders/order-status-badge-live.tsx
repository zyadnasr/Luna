"use client";

import { useEffect, useState } from "react";
import { getTranslations } from "@/i18n";
import { useLocale } from "@/components/ui/locale-provider";
import { StatusBadge } from "@/components/ui/status-badge";
import type { OrderStatus } from "@/types/orders";

function badgeTone(status: OrderStatus) {
  if (status === "delivered") return "success" as const;
  if (status === "cancelled" || status === "rejected") return "danger" as const;
  if (status === "new") return "warning" as const;
  return "info" as const;
}

export function OrderStatusBadgeLive({
  orderNumber,
  token,
  initialStatus,
}: {
  orderNumber: string;
  token: string;
  initialStatus: OrderStatus;
}) {
  const { locale } = useLocale();
  const t = getTranslations(locale);
  const [status, setStatus] = useState(initialStatus);

  useEffect(() => {
    let active = true;
    let refreshing = false;
    const refresh = async () => {
      if (refreshing || document.visibilityState === "hidden") return;
      refreshing = true;
      try {
        const response = await fetch(
          `/api/order-status/${encodeURIComponent(orderNumber)}?token=${encodeURIComponent(token)}`,
          { cache: "no-store" },
        );
        if (response.ok && active) {
          const payload = (await response.json()) as { status: OrderStatus };
          setStatus(payload.status);
        }
      } catch {
        // Keep the last known status if the refresh temporarily fails.
      } finally {
        refreshing = false;
      }
    };
    const interval = window.setInterval(refresh, 5000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [orderNumber, token]);

  return <StatusBadge status={badgeTone(status)}>{t.orders.status[status]}</StatusBadge>;
}
