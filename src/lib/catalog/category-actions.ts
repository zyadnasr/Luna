"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";

type CategoryInput = {
  id?: string;
  slug: string;
  is_active: boolean;
  sort_order: number;
  names: { ar: string; en: string; it: string };
};
type Result = { success: boolean; message: string };

export async function saveCategory(input: CategoryInput): Promise<Result> {
  const user = await requireRole("owner");
  const supabase = await createClient();
  if (!input.names.ar.trim()) return { success: false, message: "اسم التصنيف بالعربية مطلوب." };
  const payload = {
    slug: input.slug.trim(),
    is_active: input.is_active,
    sort_order: input.sort_order,
  };
  let id = input.id;
  if (id) {
    const { error } = await supabase.from("categories").update(payload).eq("id", id);
    if (error) return { success: false, message: "تعذر تحديث التصنيف." };
  } else {
    const { data, error } = await supabase.from("categories").insert(payload).select("id").single();
    if (error || !data) return { success: false, message: "تعذر إنشاء التصنيف." };
    id = data.id;
  }
  await supabase.from("category_translations").delete().eq("category_id", id);
  const names = Object.entries(input.names)
    .filter(([, name]) => name.trim())
    .map(([locale, name]) => ({ category_id: id, locale, name: name.trim() }));
  const { error: translationError } = await supabase.from("category_translations").insert(names);
  if (translationError) return { success: false, message: "تعذر حفظ أسماء التصنيف." };
  await supabase.from("audit_logs").insert({
    actor_user_id: user.id,
    action: input.id ? "category.updated" : "category.created",
    entity_type: "category",
    entity_id: id,
    metadata: {},
  });
  revalidatePath("/menu");
  revalidatePath("/admin/categories");
  return { success: true, message: input.id ? "تم تحديث التصنيف." : "تم إنشاء التصنيف." };
}
export async function deleteCategory(id: string): Promise<Result> {
  const user = await requireRole("owner");
  const supabase = await createClient();
  const { count } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("category_id", id);
  if ((count ?? 0) > 0)
    return {
      success: false,
      message: "لا يمكن حذف تصنيف يحتوي على منتجات. أعد تعيين المنتجات أولًا.",
    };
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) return { success: false, message: "تعذر حذف التصنيف." };
  await supabase.from("audit_logs").insert({
    actor_user_id: user.id,
    action: "category.deleted",
    entity_type: "category",
    entity_id: id,
    metadata: {},
  });
  revalidatePath("/menu");
  revalidatePath("/admin/categories");
  return { success: true, message: "تم حذف التصنيف." };
}
export async function reorderCategories(ids: string[]): Promise<Result> {
  const user = await requireRole("owner");
  const supabase = await createClient();
  for (const [index, id] of ids.entries()) {
    const { error } = await supabase.from("categories").update({ sort_order: index }).eq("id", id);
    if (error) return { success: false, message: "تعذر حفظ ترتيب التصنيفات." };
  }
  await supabase.from("audit_logs").insert({
    actor_user_id: user.id,
    action: "category.reordered",
    entity_type: "category",
    entity_id: null,
    metadata: { ids },
  });
  revalidatePath("/menu");
  revalidatePath("/admin/categories");
  return { success: true, message: "تم حفظ الترتيب." };
}
