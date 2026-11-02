import Link from "next/link";
import { getCurrentProfile, hasRole, requireAuth } from "@/lib/auth/server";
import { getInstapaySettings } from "@/lib/orders/actions";
import { SettingsForm } from "@/components/orders/settings-form";
import { ProfileNameForm } from "@/components/admin/profile-name-form";
import { AnnouncementSettingsForm } from "@/components/admin/announcement-settings-form";
import { getServerLocale } from "@/i18n/server";
import { translateAdminText } from "@/i18n/admin-text";
import { getAnnouncementSettings } from "@/lib/site/announcement";
import { getHomepageSettings } from "@/lib/site/homepage";
import { HomepageMediaForm } from "@/components/admin/homepage-media-form";
export const dynamic = "force-dynamic";
const settingsTabs = [
  { id: "general", label: "عام", description: "هوية مساحة الإدارة وإعدادات الدفع." },
  { id: "communications", label: "التواصل", description: "الرسائل التي تظهر لزوار الموقع." },
  {
    id: "media",
    label: "الصور والجاليري",
    description: "صور الهيرو والجاليري في الصفحة الرئيسية.",
  },
] as const;

type SettingsTab = (typeof settingsTabs)[number]["id"];

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string | string[] | undefined }>;
}) {
  const user = await requireAuth();
  const params = await searchParams;
  const [profile, isOwner, announcement, homepageMedia] = await Promise.all([
    getCurrentProfile(user.id),
    hasRole("owner"),
    getAnnouncementSettings(),
    getHomepageSettings(),
  ]);
  const locale = await getServerLocale();
  const t = (value: string) => translateAdminText(locale, value);
  const requestedTab = Array.isArray(params.tab) ? params.tab[0] : params.tab;
  const activeTab: SettingsTab =
    isOwner && settingsTabs.some((tab) => tab.id === requestedTab)
      ? (requestedTab as SettingsTab)
      : "general";
  const activeTabMeta = settingsTabs.find((tab) => tab.id === activeTab) ?? settingsTabs[0];

  return (
    <section className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-brand-primary)]">
            {t("الإدارة")}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
            {t("الإعدادات")}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--color-text-muted)] sm:text-base">
            {t("تحكم في هويتك ورسائلك العامة وإعدادات الدفع من مكان واحد.")}
          </p>
        </div>
        <div className="hidden items-center gap-2 rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2 text-xs font-semibold text-[var(--color-text-muted)] sm:flex">
          <span className="size-1.5 rounded-full bg-[var(--color-success)]" aria-hidden="true" />
          <span>{t(activeTabMeta.description)}</span>
        </div>
      </div>

      <nav
        aria-label={t("أقسام الإعدادات")}
        className="mt-10 overflow-x-auto border-b border-[var(--color-border)]"
      >
        <div className="flex min-w-max gap-8">
          {settingsTabs.map((tab) => {
            const available = isOwner || tab.id === "general";
            return available ? (
              <Link
                key={tab.id}
                href={`/admin/settings?tab=${tab.id}`}
                aria-current={activeTab === tab.id ? "page" : undefined}
                className={`relative px-1 pb-4 text-sm font-semibold transition-colors ${
                  activeTab === tab.id
                    ? "text-[var(--color-text-primary)]"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                }`}
              >
                {t(tab.label)}
                {activeTab === tab.id ? (
                  <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[var(--color-brand-primary)]" />
                ) : null}
              </Link>
            ) : null;
          })}
        </div>
      </nav>

      <div className="mt-8 max-w-4xl pb-12">
        {activeTab === "general" ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <SettingsPanel
              eyebrow={t("مساحة العمل")}
              title={t("هويتك في لوحة الإدارة")}
              description={t("الإعداد الأساسي الذي يظهر لفريق التشغيل داخل مساحة الإدارة.")}
            >
              <ProfileNameForm initial={profile?.display_name ?? ""} />
            </SettingsPanel>
            {isOwner ? (
              <SettingsPanel
                eyebrow={t("الدفع")}
                title={t("تكامل Instapay")}
                description={t("تحكم في رقم الدفع الذي يظهر أثناء إتمام الطلبات.")}
              >
                <SettingsForm initial={await getInstapaySettings()} />
              </SettingsPanel>
            ) : null}
          </div>
        ) : null}

        {activeTab === "communications" && isOwner ? (
          <SettingsPanel
            eyebrow={t("التواصل")}
            title={t("رسائل الموقع")}
            description={t("إدارة الشريط الإعلاني والنصوص التي يراها العملاء على الواجهة العامة.")}
          >
            <AnnouncementSettingsForm initial={announcement} />
          </SettingsPanel>
        ) : null}

        {activeTab === "media" && isOwner ? (
          <SettingsPanel
            eyebrow={t("الصور والجاليري")}
            title={t("محتوى الصفحة الرئيسية")}
            description={t("ارفع صور الهيرو والجاليري من جهازك وعدّل النص البديل لكل صورة.")}
          >
            <HomepageMediaForm initial={homepageMedia} />
          </SettingsPanel>
        ) : null}
      </div>
    </section>
  );
}

function SettingsPanel({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-background-deep)]/30 px-6 py-6 sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-brand-primary)]">
          {eyebrow}
        </p>
        <h2 className="mt-2 text-xl font-semibold tracking-[-0.025em]">{title}</h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]">
          {description}
        </p>
      </header>
      <div className="p-4 sm:p-6">{children}</div>
    </section>
  );
}
