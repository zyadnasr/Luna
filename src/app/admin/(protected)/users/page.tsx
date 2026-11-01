import { requirePermission } from "@/lib/auth/server";
import { getManagedUsers } from "@/lib/auth/admin-actions";
import { managedRoles } from "@/lib/auth/roles";
import { UsersManager } from "@/components/admin/users-manager";
import { StatusBadge } from "@/components/ui/status-badge";
import { getServerLocale } from "@/i18n/server";
import { translateAdminText } from "@/i18n/admin-text";

export default async function UsersPage() {
  await requirePermission("users.manage");
  const [locale, users] = await Promise.all([getServerLocale(), getManagedUsers()]);
  const t = (value: string) => translateAdminText(locale, value);
  return (
    <section>
      <div className="flex flex-col justify-between gap-5 border-b border-[var(--color-border)] pb-8 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold text-[var(--color-brand-primary)]">{t("الإدارة")}</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">{t("المستخدمون والأدوار")}</h1>
          <p className="mt-4 max-w-2xl leading-7 text-[var(--color-text-muted)]">
            {t("أرسل دعوات للمستخدمين وحدد أدوارهم وصلاحياتهم من مكان واحد.")}
          </p>
        </div>
        <StatusBadge status="info">{t("للمالك فقط")}</StatusBadge>
      </div>
      <UsersManager initialUsers={users} />
      <div className="mt-8 max-w-6xl rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]">
        <h2 className="text-xl font-semibold">{t("الأدوار المدعومة")}</h2>
        <div className="mt-5 flex flex-wrap gap-2">
          {managedRoles.map((role) => (
            <span
              className="rounded-[var(--radius-pill)] border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text-secondary)]"
              key={role}
            >
              {t(
                role === "owner"
                  ? "المالك"
                  : role === "manager"
                    ? "المدير"
                    : role === "cashier"
                      ? "الكاشير"
                      : role === "kitchen"
                        ? "المطبخ"
                        : role === "inventory"
                          ? "المخزون"
                          : "المحاسبة",
              )}
            </span>
          ))}
        </div>
        <p className="mt-6 text-sm leading-6 text-[var(--color-text-muted)]">
          {t("تُقرأ الصلاحيات من جلسة Supabase وقاعدة البيانات، وليس من بيانات يرسلها المتصفح.")}
        </p>
      </div>
    </section>
  );
}
