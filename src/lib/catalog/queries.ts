import { createClient } from "@/lib/supabase/server";
import type {
  CatalogFilter,
  CategoryWithTranslations,
  ProductWithCatalogData,
} from "@/types/catalog";

export async function getCategories(includeInactive = false) {
  const supabase = await createClient();
  let query = supabase
    .from("categories")
    .select("*, category_translations(*)")
    .order("sort_order")
    .order("created_at");
  if (!includeInactive) query = query.eq("is_active", true);
  const { data, error } = await query;
  if (error) throw new Error("تعذر تحميل التصنيفات.");
  return (data ?? []) as CategoryWithTranslations[];
}

export async function getProducts(filters: CatalogFilter = {}) {
  const supabase = await createClient();
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = 20;
  const from = (page - 1) * pageSize;
  let query = supabase
    .from("products")
    .select(
      "*, product_translations(*), product_prices(*), nutrition_facts(*), categories(slug, category_translations(*))",
      { count: "exact" },
    )
    .order("sort_order")
    .order("updated_at", { ascending: false })
    .range(from, from + pageSize - 1);
  if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
  if (filters.availability && filters.availability !== "all")
    query = query.eq("availability_status", filters.availability);
  const { data, count, error } = await query;
  if (error) throw new Error("تعذر تحميل المنتجات.");
  const products = (data ?? []) as ProductWithCatalogData[];
  const search = filters.search?.trim().toLocaleLowerCase();
  return {
    products: search
      ? products.filter((product) =>
          product.product_translations.some((translation) =>
            translation.name.toLocaleLowerCase().includes(search),
          ),
        )
      : products,
    count: count ?? 0,
    page,
    pageSize,
  };
}

export async function getProduct(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "*, product_translations(*), product_prices(*), nutrition_facts(*), categories(slug, category_translations(*))",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error("تعذر تحميل المنتج.");
  return data as ProductWithCatalogData | null;
}

export function translationName(
  translations: Array<{ locale: string; name: string }>,
  locale: string,
  fallback = "غير مسمى",
) {
  return (
    translations.find((item) => item.locale === locale)?.name ??
    translations.find((item) => item.locale === "ar")?.name ??
    fallback
  );
}
