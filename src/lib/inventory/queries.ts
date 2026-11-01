import { createClient } from "@/lib/supabase/server";
export async function getInventoryItems() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("inventory_items").select("*").order("name_ar");
  if (error) throw new Error("تعذر تحميل عناصر المخزون.");
  return data ?? [];
}
export async function getInventorySummary() {
  const supabase = await createClient();
  const [{ data: items }, { data: batches }, { count: movementCount }] = await Promise.all([
    supabase.from("inventory_items").select("id, name_ar, item_type, unit, low_stock_threshold"),
    supabase
      .from("stock_batches")
      .select("inventory_item_id, warehouse_id, quantity_available, expiry_date"),
    supabase.from("stock_movements").select("id", { count: "exact", head: true }),
  ]);
  return { items: items ?? [], batches: batches ?? [], movementCount: movementCount ?? 0 };
}

export async function getStockBatches() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("stock_batches")
    .select("*, inventory_items(name_ar, unit), warehouses(name)")
    .order("expiry_date", { ascending: true, nullsFirst: false })
    .order("received_at", { ascending: false });
  if (error) throw new Error("تعذر تحميل دفعات المخزون.");
  return data ?? [];
}

export async function getStockMovements() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("stock_movements")
    .select("*, inventory_items(name_ar), warehouses(name), stock_batches(batch_number)")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error("تعذر تحميل حركات المخزون.");
  return data ?? [];
}
