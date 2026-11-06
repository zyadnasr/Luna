"use client";

import Link from "next/link";
import { PageContainer } from "@/components/ui/page-container";
import { useLocale } from "@/components/ui/locale-provider";
import { GalleryArrangementSwitcher } from "@/components/home/gallery-arrangement-switcher";
import { ScrollExpandHero } from "@/components/home/scroll-expand-hero";
import type { HomepageSettings } from "@/lib/site/homepage";

const copy = {
  ar: {
    eyebrow: "LUNA HEALTHY · BLACK BALL",
    title: "اختيارات أهدأ،",
    titleAccent: "ليومك.",
    description: "كوكيز صحية تُحضّر بعناية. اطلبها من المنيو أو دعنا نوصلها إليك داخل القاهرة.",
    browse: "تصفح المنيو",
    story: "اكتشف قصتنا",
    scrollHint: "مرر لاستكشاف المزيد",
    galleryLabel: "من مطبخ Luna",
    galleryTitle: "تفاصيل صغيرة، مزاج أهدأ.",
    galleryBody: "لقطات من تشكيلتنا اليومية، جاهزة تختار منها اللي يناسب يومك.",
    places: "أماكن Luna",
    heading: "من مساحة الإنتاج إلى طاولتك.",
    body: "اطلب من المنيو أو تواصل معنا لطلبات التوصيل داخل القاهرة.",
    visit: "زيارة",
    table: "اطلب من طاولتك عبر QR",
    delivery: "توصيل",
    cairo: "داخل القاهرة",
    whatsapp: "للاستفسار عبر WhatsApp",
  },
  en: {
    eyebrow: "LUNA HEALTHY · BLACK BALL",
    title: "Calmer choices,",
    titleAccent: "for your day.",
    description:
      "Carefully made healthy cookies. Order from the menu or let us deliver across Cairo.",
    browse: "Browse menu",
    story: "Our story",
    scrollHint: "Scroll to explore",
    galleryLabel: "Inside Luna",
    galleryTitle: "Small details, calmer moods.",
    galleryBody: "A few glimpses from our daily collection, ready for your kind of day.",
    places: "Find Luna",
    heading: "From our kitchen to your table.",
    body: "Order from the menu or contact us for delivery across Cairo.",
    visit: "Visit",
    table: "Order from your table via QR",
    delivery: "Delivery",
    cairo: "Across Cairo",
    whatsapp: "Ask us on WhatsApp",
  },
  it: {
    eyebrow: "LUNA HEALTHY · BLACK BALL",
    title: "Scelte più leggere,",
    titleAccent: "per la tua giornata.",
    description:
      "Biscotti sani preparati con cura. Ordina dal menu o lasciaci consegnare al Cairo.",
    browse: "Apri il menu",
    story: "La nostra storia",
    scrollHint: "Scorri per esplorare",
    galleryLabel: "Dentro Luna",
    galleryTitle: "Piccoli dettagli, giornate più leggere.",
    galleryBody: "Uno sguardo alla nostra collezione quotidiana, pronta per la tua giornata.",
    places: "Trova Luna",
    heading: "Dalla nostra cucina alla tua tavola.",
    body: "Ordina dal menu o contattaci per la consegna al Cairo.",
    visit: "Visita",
    table: "Ordina dal tuo tavolo tramite QR",
    delivery: "Consegna",
    cairo: "Al Cairo",
    whatsapp: "Scrivici su WhatsApp",
  },
} as const;

export function HomePage({ media }: { media: HomepageSettings }) {
  const { locale } = useLocale();
  const t = copy[locale];

  return (
    <PageContainer className="max-w-7xl !px-5 !pt-0 !pb-0 sm:!px-8">
      <section className="py-0 sm:py-4">
        <ScrollExpandHero
          src={media.hero.src}
          alt={media.hero.alt}
          scrollHint={t.scrollHint}
          title={
            <div className="max-w-4xl text-center">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/75">
                {t.eyebrow}
              </p>
              <h1 className="mt-4 font-serif text-[clamp(2.55rem,10vw,6.5rem)] font-semibold leading-[0.98] tracking-[-0.045em] text-white drop-shadow-[0_0.2rem_1.5rem_rgba(0,0,0,0.35)]">
                {t.title}
                <br />
                <span className="font-serif font-semibold italic text-[var(--color-brand-primary)]">
                  {t.titleAccent}
                </span>
              </h1>
            </div>
          }
        >
          <div className="max-w-3xl text-center">
            <p className="mx-auto mt-5 max-w-xl text-[0.95rem] font-medium leading-7 text-white/80 sm:text-lg sm:leading-8">
              {t.description}
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3 sm:mt-8">
              <Link
                href="/menu"
                className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-pill)] bg-[var(--color-brand-secondary)] px-7 text-sm font-semibold text-[var(--color-on-brand)] shadow-[var(--shadow-soft)] transition duration-200 hover:-translate-y-0.5 hover:bg-[var(--color-brand-primary-deep)]"
              >
                {t.browse}
              </Link>
              <Link
                href="https://wa.me/201551612195"
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-pill)] border border-white/45 bg-black/15 px-7 text-sm font-semibold text-white backdrop-blur-sm transition duration-200 hover:-translate-y-0.5 hover:border-white"
              >
                {t.story}
              </Link>
            </div>
          </div>
        </ScrollExpandHero>
      </section>

      <section className="border-t border-[var(--color-border)] py-16 sm:py-24">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-brand-primary)]">
              {t.galleryLabel}
            </p>
            <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
              {t.galleryTitle}
            </h2>
          </div>
          <p className="max-w-xs text-sm leading-7 text-[var(--color-text-muted)] sm:text-end">
            {t.galleryBody}
          </p>
        </div>
        <div className="mt-8 sm:mt-10">
          <GalleryArrangementSwitcher
            images={media.gallery}
            arrangement={media.galleryArrangement}
          />
        </div>
      </section>

      <section className="grid gap-10 border-t border-[var(--color-border)] py-16 sm:py-24 md:grid-cols-2 md:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-brand-primary)]">
            {t.places}
          </p>
          <h2 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
            {t.heading}
          </h2>
          <p className="mt-5 max-w-md text-base leading-8 text-[var(--color-text-muted)]">
            {t.body}
          </p>
        </div>
        <div className="grid gap-4">
          <Link
            href="/order"
            className="group flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)] transition duration-500 ease-out hover:-translate-y-1 hover:border-[var(--color-brand-primary)] hover:shadow-[var(--shadow-soft)] sm:p-7"
          >
            <span>
              <span className="block text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                {t.visit}
              </span>
              <span className="mt-2 block text-xl font-bold">Black Ball</span>
              <span className="mt-1 block text-sm text-[var(--color-text-muted)]">{t.table}</span>
            </span>
            <span className="grid size-10 place-items-center rounded-full bg-[var(--color-background-deep)] transition group-hover:bg-[var(--color-brand-secondary)] group-hover:text-[var(--color-on-brand)]">
              →
            </span>
          </Link>
          <Link
            href="https://wa.me/201551612195"
            target="_blank"
            rel="noreferrer"
            className="group flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)] transition duration-500 ease-out hover:-translate-y-1 hover:border-[var(--color-brand-primary)] hover:shadow-[var(--shadow-soft)] sm:p-7"
          >
            <span>
              <span className="block text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                {t.delivery}
              </span>
              <span className="mt-2 block text-xl font-bold">{t.cairo}</span>
              <span className="mt-1 block text-sm text-[var(--color-text-muted)]">
                {t.whatsapp}
              </span>
            </span>
            <span className="grid size-10 place-items-center rounded-full bg-[var(--color-background-deep)] transition group-hover:bg-[var(--color-brand-secondary)] group-hover:text-[var(--color-on-brand)]">
              <svg aria-hidden="true" className="size-5 fill-current" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26C2.168 6.443 6.603 2.009 12.055 2.009a9.825 9.825 0 0 1 6.988 2.898 9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
              </svg>
            </span>
          </Link>
        </div>
      </section>
    </PageContainer>
  );
}
