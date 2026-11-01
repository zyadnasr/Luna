import type { Locale } from "@/config/site";

export type { Locale };
export type LocationType = "warehouse" | "branch";
export type QRCodeType = "table" | "general_delivery";
export type ProductAvailabilityStatus = "available" | "out_of_stock" | "hidden";
export type OrderSource = "website" | "qr_table" | "talabat" | "uber" | "whatsapp" | "manual";
export type UserRole = "owner" | "manager" | "cashier" | "kitchen" | "inventory" | "accountant";

export type Timestamped = { created_at: string; updated_at: string };
export type Location = Timestamped & {
  id: string;
  name: string;
  type: LocationType;
  address: string | null;
  is_active: boolean;
};
export type Warehouse = Timestamped & {
  id: string;
  location_id: string;
  name: string;
  is_active: boolean;
};
export type Branch = Timestamped & {
  id: string;
  location_id: string;
  name: string;
  is_active: boolean;
};
export type DiningTable = Timestamped & {
  id: string;
  branch_id: string;
  table_number: number;
  display_name: string;
  is_active: boolean;
};
export type QRCode = Timestamped & {
  id: string;
  code: string;
  type: QRCodeType;
  branch_id: string | null;
  dining_table_id: string | null;
  is_active: boolean;
};
export type Category = Timestamped & {
  id: string;
  slug: string;
  is_active: boolean;
  sort_order: number;
};
export type Product = Timestamped & {
  id: string;
  category_id: string | null;
  sku: string | null;
  is_active: boolean;
  availability_status: ProductAvailabilityStatus;
};
export type ProductTranslation = Timestamped & {
  id: string;
  product_id: string;
  locale: Locale;
  name: string;
  description: string | null;
  ingredients_text: string | null;
  allergens_text: string | null;
};
export type ProductPrice = Timestamped & {
  id: string;
  product_id: string;
  price_egp: number;
  label: string | null;
  is_active: boolean;
  valid_from: string;
  valid_until: string | null;
};
export type NutritionFacts = Timestamped & {
  id: string;
  product_id: string;
  serving_size: string | null;
  calories: number | null;
  protein_g: number | null;
  carbohydrates_g: number | null;
  sugars_g: number | null;
  total_fat_g: number | null;
  saturated_fat_g: number | null;
  trans_fat_g: number | null;
  fiber_g: number | null;
  cholesterol_mg: number | null;
  source_image_path: string | null;
  notes: string | null;
};
export type Profile = Timestamped & {
  id: string;
  display_name: string | null;
  display_name_updated_at: string | null;
  phone: string | null;
  preferred_locale: Locale;
};
export type AuditLog = {
  id: string;
  actor_user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};
export type AppSetting = Timestamped & {
  id: string;
  key: string;
  value: unknown;
  description: string | null;
  is_public: boolean;
};
