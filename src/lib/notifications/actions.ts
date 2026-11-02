"use server";

import { requireAuth } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";

export async function markNotificationRead(notificationId: string) {
  const user = await requireAuth();
  const supabase = await createClient();
  await supabase
    .from("notification_reads")
    .upsert(
      { notification_id: notificationId, user_id: user.id },
      { onConflict: "notification_id,user_id" },
    );
  return { success: true };
}
