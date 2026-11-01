import type { OrderSource } from "@/types/domain";
import type { OrderStatus } from "@/types/orders";

export async function notifyTelegram(message: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.warn("Telegram notifications are not configured.");
    return;
  }
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: message }),
    });
  } catch {
    console.warn("Telegram notification failed; order flow continues.");
  }
}

export function orderNotification(
  orderNumber: string,
  source: OrderSource,
  status: OrderStatus = "new",
) {
  return `Luna Healthy\nOrder: ${orderNumber}\nSource: ${source}\nStatus: ${status}`;
}
