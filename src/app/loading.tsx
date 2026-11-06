import { getServerLocale } from "@/i18n/server";

const loadingLabels = {
  ar: "جارٍ تجهيز الصفحة...",
  en: "Preparing the page...",
  it: "Preparazione della pagina...",
} as const;

export default async function Loading() {
  const locale = await getServerLocale();

  return (
    <main className="min-h-[60vh]" dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className="luna-page-loader" role="status" aria-label={loadingLabels[locale]}>
        <span className="luna-page-loader__track" aria-hidden="true">
          <span className="luna-page-loader__bar" />
        </span>
        <span className="sr-only">{loadingLabels[locale]}</span>
      </div>
    </main>
  );
}
