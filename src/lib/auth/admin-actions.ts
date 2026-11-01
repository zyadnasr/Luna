"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { UserRole } from "@/types/domain";
import { managedRoles } from "@/lib/auth/roles";

export type ManagedUser = {
  id: string;
  email: string;
  displayName: string;
  roles: UserRole[];
  createdAt: string;
  lastSignInAt: string | null;
};

function validateRoles(roles: UserRole[]) {
  return roles.length > 0 && roles.every((role) => managedRoles.includes(role));
}

export async function getManagedUsers(): Promise<ManagedUser[]> {
  await requirePermission("users.manage");
  const service = createServiceClient();
  const [{ data: authUsers, error: authError }, { data: profiles }, { data: roleRows }] =
    await Promise.all([
      service.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      service.from("profiles").select("id, display_name"),
      service.from("user_roles").select("user_id, role"),
    ]);
  if (authError) throw new Error("تعذر تحميل المستخدمين.");

  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile.display_name]));
  const rolesMap = new Map<string, UserRole[]>();
  for (const row of roleRows ?? []) {
    const roles = rolesMap.get(row.user_id) ?? [];
    roles.push(row.role as UserRole);
    rolesMap.set(row.user_id, roles);
  }
  return authUsers.users.map((user) => ({
    id: user.id,
    email: user.email ?? "",
    displayName: profileMap.get(user.id) ?? user.user_metadata?.display_name ?? user.email ?? "",
    roles: rolesMap.get(user.id) ?? [],
    createdAt: user.created_at,
    lastSignInAt: user.last_sign_in_at ?? null,
  }));
}

export async function inviteManagedUser(input: {
  email: string;
  displayName: string;
  roles: UserRole[];
}) {
  const actor = await requirePermission("users.manage");
  const email = input.email.trim().toLowerCase();
  const displayName = input.displayName.trim();
  if (!email || !email.includes("@"))
    return { success: false, message: "أدخل بريدًا إلكترونيًا صالحًا." };
  if (displayName.length < 2 || displayName.length > 80)
    return { success: false, message: "يجب أن يكون الاسم بين حرفين و80 حرفًا." };
  if (!validateRoles(input.roles))
    return { success: false, message: "اختر صلاحية واحدة على الأقل." };

  const service = createServiceClient();
  const inviteRedirect = new URL(
    "/admin/reset-password",
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  );
  const { data, error } = await service.auth.admin.inviteUserByEmail(email, {
    data: { display_name: displayName },
    redirectTo: inviteRedirect.toString(),
  });
  if (error || !data.user) {
    console.error("Managed user invitation failed", {
      code: error?.code,
      message: error?.message,
    });
    const errorMessage = error?.message.toLowerCase() ?? "";
    const isRateLimited =
      error?.code === "over_email_send_rate_limit" ||
      errorMessage.includes("rate limit") ||
      errorMessage.includes("too many");
    return {
      success: false,
      message: isRateLimited
        ? "تم تجاوز حد إرسال البريد في Supabase. انتظر قليلًا ثم أعد المحاولة."
        : errorMessage.includes("already") || errorMessage.includes("exist")
          ? "هذا المستخدم موجود بالفعل."
          : errorMessage.includes("redirect") || errorMessage.includes("url")
            ? "عنوان التحويل غير مسموح في إعدادات Supabase. أضف رابط الموقع ثم أعد المحاولة."
            : "تعذر إرسال دعوة المستخدم. تحقق من إعدادات البريد في Supabase.",
    };
  }

  const { error: profileError } = await service.from("profiles").upsert({
    id: data.user.id,
    display_name: displayName,
    phone: data.user.phone ?? null,
    preferred_locale: "ar",
  });
  const { error: rolesError } = await service
    .from("user_roles")
    .insert(input.roles.map((role) => ({ user_id: data.user!.id, role })));
  if (profileError || rolesError) {
    await service.auth.admin.deleteUser(data.user.id);
    return { success: false, message: "تعذر حفظ بيانات وصلاحيات المستخدم." };
  }

  const supabase = await createClient();
  await supabase.from("audit_logs").insert({
    actor_user_id: actor.id,
    action: "user.invited",
    entity_type: "user",
    entity_id: data.user.id,
    metadata: { email, roles: input.roles },
  });
  revalidatePath("/admin/users");
  return { success: true, message: "تم إرسال دعوة المستخدم." };
}

export async function updateManagedUserRoles(userId: string, roles: UserRole[]) {
  const actor = await requirePermission("users.manage");
  if (!userId || !validateRoles(roles))
    return { success: false, message: "اختر صلاحية واحدة على الأقل." };

  const service = createServiceClient();
  const { error: deleteError } = await service.from("user_roles").delete().eq("user_id", userId);
  if (deleteError) return { success: false, message: "تعذر تحديث صلاحيات المستخدم." };
  const { error: insertError } = await service
    .from("user_roles")
    .insert(roles.map((role) => ({ user_id: userId, role })));
  if (insertError) return { success: false, message: "تعذر تحديث صلاحيات المستخدم." };

  const supabase = await createClient();
  await supabase.from("audit_logs").insert({
    actor_user_id: actor.id,
    action: "user.roles_updated",
    entity_type: "user",
    entity_id: userId,
    metadata: { roles },
  });
  revalidatePath("/admin", "layout");
  revalidatePath("/admin/users");
  return { success: true, message: "تم تحديث صلاحيات المستخدم." };
}

export async function deleteManagedUser(userId: string) {
  const actor = await requirePermission("users.manage");
  if (!userId) return { success: false, message: "تعذر حذف المستخدم." };
  if (userId === actor.id) return { success: false, message: "لا يمكنك حذف حسابك الحالي من هنا." };

  const service = createServiceClient();
  const { data, error: lookupError } = await service.auth.admin.getUserById(userId);
  if (lookupError || !data.user) return { success: false, message: "المستخدم غير موجود." };

  const { error: deleteError } = await service.auth.admin.deleteUser(userId);
  if (deleteError) return { success: false, message: "تعذر حذف المستخدم." };

  // Clean up explicitly in case a deployment does not have cascading foreign keys.
  await Promise.all([
    service.from("user_roles").delete().eq("user_id", userId),
    service.from("profiles").delete().eq("id", userId),
  ]);

  const supabase = await createClient();
  await supabase.from("audit_logs").insert({
    actor_user_id: actor.id,
    action: "user.deleted",
    entity_type: "user",
    entity_id: userId,
    metadata: { email: data.user.email ?? null },
  });
  revalidatePath("/admin", "layout");
  revalidatePath("/admin/users");
  return { success: true, message: "تم حذف المستخدم نهائيًا." };
}
