"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getProductImageType, isValidProductImage } from "@/lib/catalog/image-validation";

export type BranchRecord = {
  id: string;
  location_id: string;
  name: string;
  address: string | null;
  map_url: string | null;
  image_url: string | null;
  is_active: boolean;
};

type BranchRow = {
  id: string;
  location_id: string;
  name: string;
  is_active: boolean;
  locations: { name: string; address: string | null; map_url: string | null; is_active: boolean } | null;
  image_url: string | null;
};

type LegacyBranchRow = {
  id: string;
  location_id: string;
  name: string;
  is_active: boolean;
  locations: { name: string; address: string | null; is_active: boolean } | null;
};

function isBranchMediaSchemaMissing(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  const message = `${error.code ?? ""} ${error.message ?? ""}`.toLowerCase();
  return (
    message.includes("image_url") ||
    message.includes("map_url") ||
    message.includes("schema cache") ||
    message.includes("does not exist")
  );
}

function normalizeBranches(rows: BranchRow[] | null | undefined): BranchRecord[] {
  return (rows ?? []).map((row) => ({
    id: row.id,
    location_id: row.location_id,
    name: row.name || row.locations?.name || "",
    address: row.locations?.address ?? null,
    map_url: row.locations?.map_url ?? null,
    image_url: row.image_url ?? null,
    is_active: row.is_active && Boolean(row.locations?.is_active ?? true),
  }));
}

export async function getBranches(options: { includeInactive?: boolean } = {}) {
  const supabase = await createClient();
  let query = supabase
    .from("branches")
    .select("id,location_id,name,is_active,image_url,locations!inner(name,address,map_url,is_active)")
    .order("created_at", { ascending: false });

  if (!options.includeInactive) query = query.eq("is_active", true).eq("locations.is_active", true);

  const { data, error } = await query;
  if (!error) return normalizeBranches((data ?? []) as unknown as BranchRow[]);

  // Keep the public/admin page available while a deployment is waiting for the
  // branch-media migration. New media fields remain opt-in until that migration
  // is present in the connected database.
  if (!isBranchMediaSchemaMissing(error)) throw new Error("Unable to load branches.");

  let legacyQuery = supabase
    .from("branches")
    .select("id,location_id,name,is_active,locations!inner(name,address,is_active)")
    .order("created_at", { ascending: false });
  if (!options.includeInactive) legacyQuery = legacyQuery.eq("is_active", true).eq("locations.is_active", true);

  const { data: legacyData, error: legacyError } = await legacyQuery;
  if (legacyError) throw new Error("Unable to load branches.");

  return normalizeBranches(
    ((legacyData ?? []) as unknown as LegacyBranchRow[]).map((row) => ({
      ...row,
      image_url: null,
      locations: row.locations ? { ...row.locations, map_url: null } : null,
    })),
  );
}

export async function createBranch(input: { name: string; address?: string; mapUrl?: string }) {
  await requireRole("owner");
  const name = input.name.trim();
  const address = input.address?.trim() || null;
  const mapUrl = input.mapUrl?.trim() || null;
  if (!name) throw new Error("Branch name is required.");

  const supabase = await createClient();
  let { data: location, error: locationError } = await supabase
    .from("locations")
    .insert({ name, type: "branch", address, map_url: mapUrl, is_active: true })
    .select("id")
    .single();
  if (locationError && mapUrl && isBranchMediaSchemaMissing(locationError)) {
    ({ data: location, error: locationError } = await supabase
      .from("locations")
      .insert({ name, type: "branch", address, is_active: true })
      .select("id")
      .single());
  }
  if (locationError || !location) throw new Error("Unable to create the branch location.");

  const { data: branch, error: branchError } = await supabase
    .from("branches")
    .insert({ location_id: location.id, name, is_active: true })
    .select("id")
    .single();
  if (branchError) {
    await supabase.from("locations").delete().eq("id", location.id);
    throw new Error("Unable to create the branch.");
  }

  revalidatePath("/branches");
  revalidatePath("/admin/branches");
  return branch?.id as string;
}

export async function uploadBranchImage(branchId: string, file: File) {
  await requireRole("owner");
  let uploadedPath: string | null = null;
  try {
    const contentType = getProductImageType(file);
    if (!contentType || !isValidProductImage(file)) throw new Error("Invalid branch image.");
    const service = createServiceClient();
    const extension = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
    const path = `branches/${branchId}/${crypto.randomUUID()}.${extension}`;
    uploadedPath = path;
    const { error: uploadError } = await service.storage.from("branch-media").upload(path, file, {
      cacheControl: "31536000",
      contentType,
      upsert: false,
    });
    if (uploadError) throw uploadError;
    const imageUrl = service.storage.from("branch-media").getPublicUrl(path).data.publicUrl;
    const { error: updateError } = await service.from("branches").update({ image_url: imageUrl }).eq("id", branchId);
    if (updateError) throw updateError;
    revalidatePath("/branches");
    revalidatePath("/admin/branches");
    return { success: true, imageUrl };
  } catch (error) {
    if (uploadedPath) {
      try { await createServiceClient().storage.from("branch-media").remove([uploadedPath]); } catch { /* best effort cleanup */ }
    }
    console.error("uploadBranchImage failed", { branchId, error });
    throw new Error("Unable to upload branch image.");
  }
}

export async function setBranchActive(input: { branchId: string; locationId: string; isActive: boolean }) {
  await requireRole("owner");
  const supabase = await createClient();
  const { error: branchError } = await supabase
    .from("branches")
    .update({ is_active: input.isActive })
    .eq("id", input.branchId);
  if (branchError) throw new Error("Unable to update the branch.");

  const { error: locationError } = await supabase
    .from("locations")
    .update({ is_active: input.isActive })
    .eq("id", input.locationId);
  if (locationError) throw new Error("Unable to update the branch location.");

  revalidatePath("/branches");
  revalidatePath("/admin/branches");
}

export async function updateBranch(input: {
  branchId: string;
  locationId: string;
  name: string;
  address?: string;
  mapUrl?: string;
}) {
  await requireRole("owner");
  const name = input.name.trim();
  const address = input.address?.trim() || null;
  const mapUrl = input.mapUrl?.trim() || null;
  if (!name) throw new Error("Branch name is required.");

  const supabase = await createClient();
  let { error: locationError } = await supabase
    .from("locations")
    .update({ name, address, map_url: mapUrl })
    .eq("id", input.locationId);
  if (locationError && isBranchMediaSchemaMissing(locationError)) {
    ({ error: locationError } = await supabase
      .from("locations")
      .update({ name, address })
      .eq("id", input.locationId));
  }
  if (locationError) throw new Error("Unable to update the branch location.");

  const { error: branchError } = await supabase
    .from("branches")
    .update({ name })
    .eq("id", input.branchId);
  if (branchError) throw new Error("Unable to update the branch.");

  revalidatePath("/branches");
  revalidatePath("/admin/branches");
}

export async function deleteBranch(input: { branchId: string; locationId: string }) {
  await requireRole("owner");
  const service = createServiceClient();
  const { data: branch, error: readError } = await service
    .from("branches")
    .select("id,location_id,name,is_active,image_url")
    .eq("id", input.branchId)
    .single();
  if (readError || !branch) throw new Error("Unable to find the branch.");

  const { error: branchError } = await service.from("branches").delete().eq("id", input.branchId);
  if (branchError) throw new Error("Unable to delete the branch. It may still be linked to orders or tables.");

  const { error: locationError } = await service.from("locations").delete().eq("id", input.locationId);
  if (locationError) {
    await service.from("branches").insert(branch);
    throw new Error("Unable to delete the branch location.");
  }

  try {
    const { data: files } = await service.storage.from("branch-media").list(`branches/${input.branchId}`);
    if (files?.length) {
      await service.storage.from("branch-media").remove(files.map((file) => `branches/${input.branchId}/${file.name}`));
    }
  } catch {
    // Storage cleanup is best effort after the database records are removed.
  }

  revalidatePath("/branches");
  revalidatePath("/admin/branches");
}
