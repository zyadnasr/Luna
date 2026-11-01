"use client";

import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { useLocale } from "@/components/ui/locale-provider";
import { getPublicCopy } from "@/i18n/public";

export function EmptyCatalogState({ admin = false }: { admin?: boolean }) {
  const { locale } = useLocale();
  const t = getPublicCopy(locale);
  return (
    <EmptyState
      title={
        admin
          ? locale === "ar"
            ? "لم تتم إضافة منتجات بعد"
            : locale === "it"
              ? "Nessun prodotto aggiunto"
              : "No products added yet"
          : t.catalogPreparing
      }
      description={
        admin
          ? locale === "ar"
            ? "ابدأ بإضافة أول منتج حقيقي مع معلوماته وترجماته وأسعاره."
            : locale === "it"
              ? "Aggiungi il primo prodotto con informazioni, traduzioni e prezzi."
              : "Add the first real product with its information, translations, and prices."
          : t.catalogPreparingHint
      }
      action={
        admin ? (
          <Link
            className="inline-flex min-h-11 items-center rounded-[var(--radius-pill)] bg-[var(--color-brand-secondary)] px-5 text-sm font-semibold text-[var(--color-on-brand)]"
            href="/admin/products/new"
          >
            إضافة أول منتج
          </Link>
        ) : undefined
      }
    />
  );
}
