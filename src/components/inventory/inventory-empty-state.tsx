"use client";

import { EmptyState } from "@/components/ui/empty-state";
import { useLocale } from "@/components/ui/locale-provider";
import { translateAdminText } from "@/i18n/admin-text";

export function InventoryEmptyState({
  title = "لا توجد بيانات مخزون بعد",
  description = "أضف عناصر المخزون أو الوصفات يدويًا عند توفر البيانات المؤكدة.",
}: {
  title?: string;
  description?: string;
}) {
  const { locale } = useLocale();
  return (
    <EmptyState
      title={translateAdminText(locale, title)}
      description={translateAdminText(locale, description)}
    />
  );
}
