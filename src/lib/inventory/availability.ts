import { createServiceClient } from "@/lib/supabase/service";

export async function getProductAvailability(
  productId: string,
  priceId: string,
  orderQuantity = 1,
) {
  // Availability is checked on the server and only the boolean result leaves this module.
  // Inventory tables are intentionally not publicly readable through RLS.
  const supabase = createServiceClient();
  const { data: product } = await supabase
    .from("products")
    .select("id, availability_status")
    .eq("id", productId)
    .maybeSingle();
  if (!product || product.availability_status !== "available")
    return { available: false, reason: "product_unavailable" as const };
  const { data: price } = await supabase
    .from("product_prices")
    .select("id, product_id, is_active, valid_until")
    .eq("id", priceId)
    .maybeSingle();
  if (
    !price ||
    price.product_id !== productId ||
    !price.is_active ||
    (price.valid_until && new Date(price.valid_until) <= new Date())
  )
    return { available: false, reason: "price_unavailable" as const };
  const { data: recipe } = await supabase
    .from("recipes")
    .select("id, product_price_id, recipe_items(inventory_item_id, quantity)")
    .eq("product_id", productId)
    .eq("is_active", true)
    .or(`product_price_id.eq.${priceId},product_price_id.is.null`)
    .order("product_price_id", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  if (!recipe) return { available: false, reason: "missing_recipe" as const };
  const itemIds = (recipe.recipe_items ?? []).map((item) => item.inventory_item_id);
  if (!itemIds.length) return { available: false, reason: "empty_recipe" as const };
  const { data: batches } = await supabase
    .from("stock_batches")
    .select("inventory_item_id, quantity_available, expiry_date")
    .in("inventory_item_id", itemIds)
    .gt("quantity_available", 0)
    .or("expiry_date.is.null,expiry_date.gte." + new Date().toISOString().slice(0, 10));
  for (const item of recipe.recipe_items ?? []) {
    const availableQuantity = (batches ?? [])
      .filter((batch) => batch.inventory_item_id === item.inventory_item_id)
      .reduce((sum, batch) => sum + Number(batch.quantity_available), 0);
    if (availableQuantity < Number(item.quantity) * orderQuantity)
      return { available: false, reason: "insufficient_stock" as const };
  }
  return { available: true as const };
}
