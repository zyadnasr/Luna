"use server";
import { revalidatePath } from "next/cache";
import { requireAnyRole } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
export async function saveInventoryItem(input: {
  id?: string;
  name_ar: string;
  name_en: string;
  name_it: string;
  item_type: "ingredient" | "packaging" | "finished_product";
  sku?: string;
  unit: string;
  low_stock_threshold: number;
}) {
  const user = await requireAnyRole(["owner", "inventory"]);
  const supabase = await createClient();
  if (!input.name_ar.trim()) return { success: false, message: "الاسم العربي مطلوب." };
  const payload = { ...input, sku: input.sku?.trim() || null };
  const result = input.id
    ? await supabase.from("inventory_items").update(payload).eq("id", input.id)
    : await supabase.from("inventory_items").insert(payload);
  if (result.error) return { success: false, message: "تعذر حفظ عنصر المخزون." };
  await supabase.from("audit_logs").insert({
    actor_user_id: user.id,
    action: input.id ? "inventory_item.updated" : "inventory_item.created",
    entity_type: "inventory_item",
    entity_id: input.id ?? null,
    metadata: {},
  });
  revalidatePath("/admin/inventory");
  revalidatePath("/admin/inventory/items");
  return { success: true, message: "تم الحفظ." };
}

export async function receiveBatch(input: {
  itemId: string;
  warehouseId: string;
  quantity: number;
  unitCost?: number;
  receivedAt: string;
  expiryDate?: string;
  batchNumber?: string;
  supplier?: string;
  notes?: string;
}) {
  const user = await requireAnyRole(["owner", "inventory"]);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("receive_inventory_batch", {
    item_id: input.itemId,
    warehouse_id: input.warehouseId,
    received: input.quantity,
    cost: input.unitCost ?? null,
    received_at_input: input.receivedAt,
    expiry_input: input.expiryDate || null,
    batch_input: input.batchNumber || null,
    supplier_input: input.supplier || null,
    notes_input: input.notes || null,
  });
  if (error) return { success: false, message: "تعذر استلام الدفعة." };
  await supabase.from("audit_logs").insert({
    actor_user_id: user.id,
    action: "batch.received",
    entity_type: "stock_batch",
    entity_id: data?.id ?? null,
    metadata: {},
  });
  revalidatePath("/admin/inventory/batches");
  return { success: true, message: "تم استلام الدفعة." };
}
export async function createWaste(input: {
  warehouseId: string;
  itemId: string;
  batchId: string;
  quantity: number;
  reason: string;
  notes?: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("create_waste", {
    warehouse_id_input: input.warehouseId,
    item_id_input: input.itemId,
    batch_id_input: input.batchId,
    quantity_input: input.quantity,
    reason_input: input.reason,
    notes_input: input.notes || null,
  });
  if (error) return { success: false, message: "تعذر تسجيل الهدر." };
  revalidatePath("/admin/inventory/waste");
  return { success: true, message: "تم تسجيل الهدر." };
}

export async function completeTransfer(transferId: string) {
  const user = await requireAnyRole(["owner", "inventory"]);
  const supabase = await createClient();
  const { error } = await supabase.rpc("complete_stock_transfer", {
    transfer_id_input: transferId,
  });
  if (error) return { success: false, message: "تعذر إكمال النقل." };
  await supabase.from("audit_logs").insert({
    actor_user_id: user.id,
    action: "transfer.completed",
    entity_type: "stock_transfer",
    entity_id: transferId,
    metadata: {},
  });
  revalidatePath("/admin/inventory/transfers");
  return { success: true, message: "تم إكمال النقل." };
}
export async function completeCount(countId: string) {
  const user = await requireAnyRole(["owner", "inventory"]);
  const supabase = await createClient();
  const { error } = await supabase.rpc("complete_stock_count", { count_id_input: countId });
  if (error) return { success: false, message: "تعذر إكمال الجرد." };
  await supabase.from("audit_logs").insert({
    actor_user_id: user.id,
    action: "count.completed",
    entity_type: "stock_count",
    entity_id: countId,
    metadata: {},
  });
  revalidatePath("/admin/inventory/counts");
  return { success: true, message: "تم إكمال الجرد." };
}
export async function cancelTransfer(id: string) {
  const user = await requireAnyRole(["owner", "inventory"]);
  const supabase = await createClient();
  const { error } = await supabase
    .from("stock_transfers")
    .update({ status: "cancelled" })
    .eq("id", id)
    .in("status", ["draft", "submitted"]);
  if (error) return { success: false, message: "تعذر إلغاء النقل." };
  await supabase.from("audit_logs").insert({
    actor_user_id: user.id,
    action: "transfer.cancelled",
    entity_type: "stock_transfer",
    entity_id: id,
    metadata: {},
  });
  revalidatePath("/admin/inventory/transfers");
  return { success: true, message: "تم إلغاء النقل." };
}
export async function cancelCount(id: string) {
  const user = await requireAnyRole(["owner", "inventory"]);
  const supabase = await createClient();
  const { error } = await supabase
    .from("stock_counts")
    .update({ status: "cancelled" })
    .eq("id", id)
    .eq("status", "open");
  if (error) return { success: false, message: "تعذر إلغاء الجرد." };
  await supabase.from("audit_logs").insert({
    actor_user_id: user.id,
    action: "count.cancelled",
    entity_type: "stock_count",
    entity_id: id,
    metadata: {},
  });
  revalidatePath("/admin/inventory/counts");
  return { success: true, message: "تم إلغاء الجرد." };
}
export async function openCount(warehouseId: string, reason: string) {
  const user = await requireAnyRole(["owner", "inventory"]);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("stock_counts")
    .insert({ warehouse_id: warehouseId, reason, opened_by: user.id })
    .select("id")
    .single();
  if (error) return { success: false, message: "تعذر فتح الجرد." };
  await supabase.from("audit_logs").insert({
    actor_user_id: user.id,
    action: "count.opened",
    entity_type: "stock_count",
    entity_id: data.id,
    metadata: {},
  });
  revalidatePath("/admin/inventory/counts");
  return { success: true, message: "تم فتح الجرد." };
}

export async function createTransfer(input: {
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  itemId: string;
  batchId: string;
  quantity: number;
  note?: string;
}) {
  const user = await requireAnyRole(["owner", "inventory"]);
  if (input.sourceWarehouseId === input.destinationWarehouseId || input.quantity <= 0)
    return { success: false, message: "بيانات النقل غير صالحة." };
  const supabase = await createClient();
  const { data: transfer, error } = await supabase
    .from("stock_transfers")
    .insert({
      source_warehouse_id: input.sourceWarehouseId,
      destination_warehouse_id: input.destinationWarehouseId,
      note: input.note ?? null,
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error || !transfer) return { success: false, message: "تعذر إنشاء النقل." };
  await supabase.from("stock_transfer_items").insert({
    transfer_id: transfer.id,
    inventory_item_id: input.itemId,
    batch_id: input.batchId,
    quantity: input.quantity,
  });
  await supabase.from("audit_logs").insert({
    actor_user_id: user.id,
    action: "transfer.created",
    entity_type: "stock_transfer",
    entity_id: transfer.id,
    metadata: {},
  });
  revalidatePath("/admin/inventory/transfers");
  return { success: true, message: "تم إنشاء النقل." };
}

export async function saveRecipe(input: {
  id?: string;
  productId: string;
  priceId?: string;
  note?: string;
  isActive: boolean;
  items: Array<{ inventoryItemId: string; quantity: number; unit: string; note?: string }>;
}) {
  const user = await requireAnyRole(["owner", "inventory"]);
  if (
    !input.items.length ||
    input.items.some((item) => item.quantity <= 0 || !item.inventoryItemId)
  )
    return { success: false, message: "أضف عناصر وصفة صحيحة." };
  const supabase = await createClient();
  const existing = await supabase
    .from("recipes")
    .select("id")
    .eq("product_id", input.productId)
    .is("product_price_id", input.priceId ?? null);
  if (!input.id && existing.data?.length)
    return { success: false, message: "هذه الوصفة موجودة بالفعل." };
  const payload = {
    product_id: input.productId,
    product_price_id: input.priceId || null,
    note: input.note || null,
    is_active: input.isActive,
  };
  const result = input.id
    ? await supabase.from("recipes").update(payload).eq("id", input.id).select("id").single()
    : await supabase.from("recipes").insert(payload).select("id").single();
  const recipeId = result.data?.id ?? input.id;
  if (result.error || !recipeId) return { success: false, message: "تعذر حفظ الوصفة." };
  await supabase.from("recipe_items").delete().eq("recipe_id", recipeId);
  await supabase.from("recipe_items").insert(
    input.items.map((item) => ({
      recipe_id: recipeId,
      inventory_item_id: item.inventoryItemId,
      quantity: item.quantity,
      unit: item.unit,
      note: item.note || null,
    })),
  );
  await supabase.from("audit_logs").insert({
    actor_user_id: user.id,
    action: input.id ? "recipe.updated" : "recipe.created",
    entity_type: "recipe",
    entity_id: recipeId,
    metadata: {},
  });
  revalidatePath("/admin/inventory/recipes");
  return { success: true, message: "تم حفظ الوصفة." };
}
