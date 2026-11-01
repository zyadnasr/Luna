"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function updateDisplayName(value: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const displayName = value.trim();

  if (!user) return { success: false, message: "يجب تسجيل الدخول أولًا." };
  if (displayName.length < 2 || displayName.length > 80) {
    return { success: false, message: "يجب أن يكون الاسم بين حرفين و80 حرفًا." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("display_name_updated_at")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError || !profile) return { success: false, message: "تعذر قراءة بيانات الاسم." };

  const lastChangedAt = profile.display_name_updated_at
    ? new Date(profile.display_name_updated_at).getTime()
    : null;
  if (lastChangedAt && Date.now() - lastChangedAt < 14 * 24 * 60 * 60 * 1000) {
    return { success: false, message: "يمكن تغيير الاسم مرة كل 14 يومًا." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName })
    .eq("id", user.id);

  if (error) {
    if (error.message.includes("display_name_cooldown")) {
      return { success: false, message: "يمكن تغيير الاسم مرة كل 14 يومًا." };
    }
    return { success: false, message: "تعذر حفظ الاسم." };
  }

  revalidatePath("/admin", "layout");
  return { success: true, message: "تم حفظ الاسم." };
}
