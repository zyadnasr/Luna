import type { Locale } from "@/config/site";
import type { ProductAvailabilityStatus, ProductPrice, NutritionFacts } from "./domain";

export type CatalogTranslationInput = {
  locale: Locale;
  name: string;
  description: string;
  ingredients_text: string;
  allergens_text: string;
};
export type CategoryTranslation = {
  id: string;
  category_id: string;
  locale: Locale;
  name: string;
  created_at: string;
  updated_at: string;
};
export type CategoryWithTranslations = {
  id: string;
  slug: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  category_translations: CategoryTranslation[];
};
export type ProductWithCatalogData = {
  id: string;
  category_id: string | null;
  sku: string | null;
  image_url: string | null;
  is_active: boolean;
  availability_status: ProductAvailabilityStatus;
  sort_order: number;
  created_at: string;
  updated_at: string;
  product_translations: CatalogTranslationInput[];
  product_prices: ProductPrice[];
  nutrition_facts: NutritionFacts | null;
  categories: { slug: string; category_translations: CategoryTranslation[] } | null;
};
export type CatalogFilter = {
  search?: string;
  categoryId?: string;
  availability?: ProductAvailabilityStatus | "all";
  page?: number;
};
export type NutritionFormData = {
  serving_size: string;
  calories: number | string | null;
  protein_g: number | string | null;
  carbohydrates_g: number | string | null;
  sugars_g: number | string | null;
  total_fat_g: number | string | null;
  saturated_fat_g: number | string | null;
  trans_fat_g: number | string | null;
  fiber_g: number | string | null;
  cholesterol_mg: number | string | null;
  source_image_path: string;
  notes: string;
};
export type ProductFormData = {
  id?: string;
  image_url?: string | null;
  category_id: string | null;
  sku: string;
  is_active: boolean;
  availability_status: ProductAvailabilityStatus;
  translations: CatalogTranslationInput[];
  prices: Array<{
    id?: string;
    label: string;
    price_egp: number | string;
    compare_at_price_egp?: number | string | null;
    is_active: boolean;
    valid_from: string;
    valid_until: string;
  }>;
  nutrition: NutritionFormData;
};
