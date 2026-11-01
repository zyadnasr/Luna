"use client";

import Link from "next/link";
import Image from "next/image";
import { PageContainer } from "@/components/ui/page-container";
import { useLocale } from "@/components/ui/locale-provider";

export default function Home() {
  const { locale } = useLocale();
  const t = {
    ar: {
      title: (
        <>
          اختيارات أهدأ،
          <br />
          <span className="text-[var(--color-brand-primary)]">ليومك.</span>
        </>
      ),
      description: "كوكيز صحية تُحضّر بعناية. اطلبها من المنيو أو دعنا نوصلها إليك داخل القاهرة.",
      menu: "تصفح المنيو",
      story: "اكتشف قصتنا",
      places: "أماكن لونا",
      galleryLabel: "من مطبخ لونا",
      galleryTitle: "تفاصيل صغيرة، مزاج أهدأ.",
      galleryBody: "لقطات من تشكيلتنا اليومية، جاهزة تختار منها اللي يناسب يومك.",
      heading: "من مساحة الإنتاج إلى طاولتك.",
      body: "اطلب من المنيو أو تواصل معنا لطلبات التوصيل داخل القاهرة.",
      visit: "زيارة",
      table: "اطلب من طاولتك عبر QR",
      delivery: "توصيل",
      cairo: "داخل القاهرة",
      whatsapp: "للاستفسار عبر WhatsApp",
    },
    en: {
      title: (
        <>
          Calmer choices,
          <br />
          <span className="text-[var(--color-brand-primary)]">for your day.</span>
        </>
      ),
      description:
        "Carefully made healthy cookies. Order from the menu or let us deliver across Cairo.",
      menu: "Browse menu",
      story: "Our story",
      places: "Find Luna",
      galleryLabel: "Inside Luna",
      galleryTitle: "Small details, calmer moods.",
      galleryBody: "A few glimpses from our daily collection, ready for your kind of day.",
      heading: "From our kitchen to your table.",
      body: "Order from the menu or contact us for delivery across Cairo.",
      visit: "Visit",
      table: "Order from your table via QR",
      delivery: "Delivery",
      cairo: "Across Cairo",
      whatsapp: "Ask us on WhatsApp",
    },
    it: {
      title: (
        <>
          Scelte più leggere,
          <br />
          <span className="text-[var(--color-brand-primary)]">per la tua giornata.</span>
        </>
      ),
      description:
        "Biscotti sani preparati con cura. Ordina dal menu o lasciaci consegnare al Cairo.",
      menu: "Apri il menu",
      story: "La nostra storia",
      places: "Trova Luna",
      galleryLabel: "Dentro Luna",
      galleryTitle: "Piccoli dettagli, giornate più leggere.",
      galleryBody: "Uno sguardo alla nostra collezione quotidiana, pronta per la tua giornata.",
      heading: "Dalla nostra cucina alla tua tavola.",
      body: "Ordina dal menu o contattaci per la consegna al Cairo.",
      visit: "Visita",
      table: "Ordina dal tuo tavolo tramite QR",
      delivery: "Consegna",
      cairo: "Al Cairo",
      whatsapp: "Scrivici su WhatsApp",
    },
  }[locale];
  const menuImage = locale === "ar" ? "/assets/menu-ar.jpeg" : "/assets/menu-en.jpeg";
  const menuImageAlt = locale === "ar" ? "قائمة لونا هيلثي العربية" : "Luna Healthy English menu";
  const galleryItems = [
    { src: menuImage, position: "center top", alt: "Luna Gold cookies" },
    { src: menuImage, position: "left center", alt: "Luna Classic cookies" },
    { src: "/assets/cookies-cutout.png", position: "center", alt: "Luna cookies" },
    { src: menuImage, position: "right bottom", alt: "Luna Bites cookies" },
    { src: menuImage, position: "center bottom", alt: "Luna Mini cookies" },
  ];
  return (
    <PageContainer className="max-w-7xl">
      <section className="grid items-center gap-7 py-2 sm:gap-8 sm:py-5 md:gap-10 md:py-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:py-10">
        <div className="order-2 max-w-xl lg:order-1">
          <p className="mb-5 text-sm font-bold text-[var(--color-brand-primary)]">
            LUNA HEALTHY · BLACK BALL
          </p>
          <h1 className="max-w-lg text-[2.7rem] font-bold leading-[1.08] tracking-[-0.05em] sm:text-6xl">
            {t.title}
          </h1>
          <p className="mt-6 max-w-md text-base leading-8 text-[var(--color-text-secondary)]">
            {t.description}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/menu"
              className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-pill)] bg-[var(--color-brand-secondary)] px-6 text-sm font-semibold text-[var(--color-on-brand)] shadow-[var(--shadow-soft)] transition duration-200 hover:-translate-y-0.5 hover:bg-[var(--color-brand-primary-deep)]"
            >
              {t.menu}
            </Link>
            <Link
              href="https://wa.me/201551612195"
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-pill)] border border-[var(--color-border-strong)] bg-[var(--color-surface-glass)] px-6 text-sm font-semibold text-[var(--color-text-secondary)] transition duration-200 hover:-translate-y-0.5 hover:border-[var(--color-brand-primary)]"
            >
              {t.story}
            </Link>
          </div>
        </div>
        <div className="relative order-1 lg:order-2">
          <div className="overflow-hidden rounded-[1.65rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-elevated)] sm:rounded-[2rem]">
            <Image
              src={menuImage}
              alt={menuImageAlt}
              width={1080}
              height={1350}
              className="h-auto max-h-[34rem] w-full object-contain object-top"
            />
          </div>
        </div>
      </section>
      <section className="relative -mx-5 overflow-hidden py-10 sm:-mx-8 sm:py-14">
        <div className="px-5 sm:px-8">
          <p className="text-sm font-semibold text-[var(--color-brand-primary)]">
            {t.galleryLabel}
          </p>
          <div className="mt-3 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <h2 className="max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">
              {t.galleryTitle}
            </h2>
            <p className="max-w-sm text-sm leading-7 text-[var(--color-text-muted)]">
              {t.galleryBody}
            </p>
          </div>
        </div>
        <div className="luna-gallery-scroll mt-8 flex w-max snap-x snap-mandatory items-end gap-4 overflow-x-auto px-5 pb-3 sm:gap-6 sm:px-8">
          {galleryItems.map((item, index) => (
            <figure
              className={`relative h-56 w-44 shrink-0 snap-start overflow-hidden rounded-[2rem] sm:h-72 sm:w-56 ${index % 2 === 0 ? "-rotate-2" : "rotate-2"}`}
              key={`${item.src}-${index}`}
            >
              <Image
                src={item.src}
                alt={item.alt}
                fill
                sizes="(max-width: 640px) 176px, 224px"
                className={item.src.endsWith(".png") ? "object-contain p-5" : "object-cover"}
                style={{ objectPosition: item.position }}
              />
            </figure>
          ))}
        </div>
      </section>
      <section className="grid gap-5 border-t border-[var(--color-border)] py-10 sm:py-12 md:grid-cols-3">
        <div className="md:col-span-2">
          <p className="text-sm font-semibold text-[var(--color-brand-primary)]">{t.places}</p>
          <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
            {t.heading}
          </h2>
          <p className="mt-4 max-w-xl leading-7 text-[var(--color-text-muted)]">{t.body}</p>
        </div>
        <div className="grid gap-3">
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]">
            <p className="text-xs text-[var(--color-text-muted)]">{t.visit}</p>
            <p className="mt-2 font-semibold">Black Ball</p>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">{t.table}</p>
          </div>
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]">
            <p className="text-xs text-[var(--color-text-muted)]">{t.delivery}</p>
            <p className="mt-2 font-semibold">{t.cairo}</p>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">{t.whatsapp}</p>
          </div>
        </div>
      </section>
    </PageContainer>
  );
}
