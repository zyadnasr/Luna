import { getCurrentProfile, hasRole, requireAuth } from "@/lib/auth/server";
import { getInstapaySettings } from "@/lib/orders/actions";
import { SettingsForm } from "@/components/orders/settings-form";
import { ProfileNameForm } from "@/components/admin/profile-name-form";
import { AnnouncementSettingsForm } from "@/components/admin/announcement-settings-form";
import { getServerLocale } from "@/i18n/server";
import { translateAdminText } from "@/i18n/admin-text";
import { getAnnouncementSettings } from "@/lib/site/announcement";
export const dynamic = "force-dynamic";
export default async function SettingsPage() {
  const user = await requireAuth();
  const [profile, isOwner, announcement] = await Promise.all([
    getCurrentProfile(user.id),
    hasRole("owner"),
    getAnnouncementSettings(),
  ]);
  const locale = await getServerLocale();
  const t = (value: string) => translateAdminText(locale, value);
  return (
    <section>
      <p className="text-sm font-semibold text-[var(--color-brand-primary)]">{t("الإدارة")}</p>
      <h1 className="mt-3 text-4xl font-semibold">{t("الإعدادات")}</h1>
      <p className="mt-4 max-w-2xl leading-7 text-[var(--color-text-muted)]">
        {t("تحكم في هويتك ورسائلك العامة وإعدادات الدفع من مكان واحد.")}
      </p>
      <div className="mt-10 grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] lg:items-start">
        <div className="grid gap-3">
          <p className="px-1 text-xs font-semibold tracking-[0.12em] text-[var(--color-text-muted)]">
            {t("مساحتك")}
          </p>
          <ProfileNameForm initial={profile?.display_name ?? ""} />
          {isOwner ? (
            <>
              <p className="mt-4 px-1 text-xs font-semibold tracking-[0.12em] text-[var(--color-text-muted)]">
                {t("الدفع")}
              </p>
              <SettingsForm initial={await getInstapaySettings()} />
            </>
          ) : null}
        </div>
        {isOwner ? (
          <div className="grid gap-3">
            <p className="px-1 text-xs font-semibold tracking-[0.12em] text-[var(--color-text-muted)]">
              {t("التواصل مع العملاء")}
            </p>
            <AnnouncementSettingsForm initial={announcement} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
