import { requirePermission, getCurrentRoles } from "@/lib/auth/server";
import { getAnalyticsSettings, getAnalyticsSnapshot } from "@/lib/analytics/config";
import { AnalyticsSettingsForm } from "@/components/admin/analytics-settings-form";
import { getServerLocale } from "@/i18n/server";

export const dynamic = "force-dynamic";

const copy = {
  ar: {
    eyebrow: "التسويق والتحليل",
    title: "تحليلات الإعلانات",
    description: "تتبع الزيارات والحملات والتحويلات من مكان واحد.",
    integrations: "ربط المنصات",
    integrationsDesc: "أدخل المعرفات العامة فقط. أسرار OAuth ومفاتيح الإعلانات لا تُحفظ هنا.",
    performance: "أداء الموقع والحملات",
    sessions: "الجلسات",
    views: "مشاهدات الصفحات",
    cart: "إضافات للسلة",
    checkout: "بدء الدفع",
    purchases: "عمليات الشراء",
    conversion: "معدل التحويل",
    revenue: "الإيراد المنسوب",
    sources: "مصادر الزيارات",
    campaigns: "الحملات",
    noData: "لا توجد بيانات بعد.",
    apiNote: "لإظهار الإنفاق وROAS ونتائج الحملات من Google Ads وMeta Ads، أضف بيانات OAuth/API للحسابات في بيئة الخادم.",
    ownerNote: "إدارة الربط متاحة للمالك فقط.",
  },
  en: {
    eyebrow: "Marketing & analytics",
    title: "Ad analytics",
    description: "Track visits, campaigns, and conversions from one place.",
    integrations: "Platform connections",
    integrationsDesc: "Only public IDs belong here. OAuth secrets and ad API keys stay server-side.",
    performance: "Site and campaign performance",
    sessions: "Sessions",
    views: "Page views",
    cart: "Add to carts",
    checkout: "Checkouts",
    purchases: "Purchases",
    conversion: "Conversion rate",
    revenue: "Attributed revenue",
    sources: "Traffic sources",
    campaigns: "Campaigns",
    noData: "No data yet.",
    apiNote: "To show spend, ROAS, and live campaign results from Google Ads and Meta Ads, add the accounts' OAuth/API credentials to the server environment.",
    ownerNote: "Connection settings are available to the owner only.",
  },
  it: {
    eyebrow: "Marketing e analisi",
    title: "Analisi pubblicitarie",
    description: "Monitora visite, campagne e conversioni da un unico posto.",
    integrations: "Connessioni piattaforme",
    integrationsDesc: "Qui vanno solo gli ID pubblici. I segreti OAuth restano sul server.",
    performance: "Performance del sito e delle campagne",
    sessions: "Sessioni",
    views: "Visualizzazioni",
    cart: "Aggiunte al carrello",
    checkout: "Checkout",
    purchases: "Acquisti",
    conversion: "Tasso di conversione",
    revenue: "Entrate attribuite",
    sources: "Sorgenti",
    campaigns: "Campagne",
    noData: "Nessun dato ancora.",
    apiNote: "Per mostrare spesa, ROAS e risultati live, aggiungi le credenziali OAuth/API nell'ambiente server.",
    ownerNote: "Le impostazioni sono disponibili solo al proprietario.",
  },
} as const;

function formatNumber(value: number, locale: string) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : locale === "it" ? "it-IT" : "en-US", { maximumFractionDigits: 1 }).format(value);
}

export default async function AnalyticsPage() {
  await requirePermission("reports.view");
  const [locale, settings, snapshot, roles] = await Promise.all([
    getServerLocale(),
    getAnalyticsSettings(),
    getAnalyticsSnapshot(),
    getCurrentRoles(),
  ]);
  const text = copy[locale];
  const isOwner = roles.includes("owner");
  const metrics = [
    [text.sessions, snapshot.sessions],
    [text.views, snapshot.pageViews],
    [text.cart, snapshot.addToCart],
    [text.checkout, snapshot.checkouts],
    [text.purchases, snapshot.purchases],
    [text.conversion, `${formatNumber(snapshot.conversionRate, locale)}%`],
    [text.revenue, `${formatNumber(snapshot.revenue, locale)} EGP`],
  ];
  return (
    <div className="grid gap-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-brand-primary)]">{text.eyebrow}</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{text.title}</h1>
        <p className="mt-3 max-w-2xl text-sm text-[var(--color-text-secondary)]">{text.description}</p>
      </header>
      <section className="grid gap-5 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]">
        <div>
          <h2 className="text-xl font-semibold">{text.integrations}</h2>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{text.integrationsDesc}</p>
        </div>
        {isOwner ? <AnalyticsSettingsForm initial={settings} /> : <p className="text-sm text-[var(--color-text-muted)]">{text.ownerNote}</p>}
        <p className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-glass)] p-4 text-xs leading-6 text-[var(--color-text-muted)]">{text.apiNote}</p>
      </section>
      <section className="grid gap-5">
        <div>
          <h2 className="text-xl font-semibold">{text.performance}</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map(([label, value]) => <article className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5" key={String(label)}><p className="text-sm text-[var(--color-text-muted)]">{label}</p><p className="mt-3 text-2xl font-semibold">{value}</p></article>)}
        </div>
      </section>
      <section className="grid gap-5 lg:grid-cols-2">
        {[[text.sources, snapshot.sources], [text.campaigns, snapshot.campaigns]].map(([title, rows]) => (
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6" key={String(title)}>
            <h2 className="text-lg font-semibold">{title}</h2>
            <div className="mt-5 grid gap-3">{(rows as [string, number][]).length ? (rows as [string, number][]).map(([name, value]) => <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3 text-sm last:border-0" key={name}><span className="text-[var(--color-text-secondary)]">{name}</span><span className="font-semibold">{formatNumber(value, locale)}</span></div>) : <p className="text-sm text-[var(--color-text-muted)]">{text.noData}</p>}</div>
          </div>
        ))}
      </section>
    </div>
  );
}
