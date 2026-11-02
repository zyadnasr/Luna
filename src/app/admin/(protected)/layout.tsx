import type { ReactNode } from "react";
import { ensureCurrentProfile, getCurrentRoles, requireAuth } from "@/lib/auth/server";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminNotifications } from "@/lib/notifications/server";

export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({ children }: { children: ReactNode }) {
  const user = await requireAuth();
  const profile = await ensureCurrentProfile();
  const roles = await getCurrentRoles(user.id);
  const canReceiveOrderNotifications = roles.some((role) =>
    ["owner", "manager", "cashier", "kitchen"].includes(role),
  );
  const notifications = canReceiveOrderNotifications ? await getAdminNotifications(user.id) : [];
  return (
    <AdminShell user={user} profile={profile} roles={roles} initialNotifications={notifications}>
      {children}
    </AdminShell>
  );
}
