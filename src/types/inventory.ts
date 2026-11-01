export type InventoryItemType = "ingredient" | "packaging" | "finished_product";
export type InventoryUnit =
  "piece" | "gram" | "kilogram" | "milliliter" | "liter" | "box" | "pack" | "bag";
export type InventoryItem = {
  id: string;
  name_ar: string;
  name_en: string;
  name_it: string;
  item_type: InventoryItemType;
  sku: string | null;
  unit: InventoryUnit;
  is_active: boolean;
  low_stock_threshold: number;
  created_at: string;
  updated_at: string;
};
