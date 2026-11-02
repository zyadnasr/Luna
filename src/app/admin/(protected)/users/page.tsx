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
    <section className="mx-auto max-w-6xl">
      <div className="flex flex-col justify-between gap-5 border-b border-[var(--color-border)] pb-8 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-brand-primary)]">
            {t("الإدارة")}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
            {t("المستخدمون والأدوار")}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--color-text-muted)] sm:text-base">
            {t("أرسل دعوات للمستخدمين وحدد أدوارهم وصلاحياتهم من مكان واحد.")}
          </p>
        </div>
        <StatusBadge status="info">{t("للمالك فقط")}</StatusBadge>
      </div>
      <UsersManager initialUsers={users} />
      <div className="mt-6 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)] sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-lg font-semibold">{t("الأدوار المدعومة")}</h2>
          <span className="text-xs text-[var(--color-text-muted)]">{t("إدارة الوصول")}</span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
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
