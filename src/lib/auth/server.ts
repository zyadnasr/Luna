import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/types/domain";
import type { Permission } from "./permissions";
import { roleHasPermission } from "./permissions";

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  return user;
}

export async function getCurrentProfile(userId?: string): Promise<Profile | null> {
  const user = userId ? { id: userId } : await getCurrentUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return data as Profile | null;
}

export async function ensureCurrentProfile() {
  const user = await requireAuth();
  const existing = await getCurrentProfile(user.id);
  if (existing) return existing;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      display_name: user.user_metadata?.display_name ?? user.email ?? null,
      phone: user.phone ?? null,
      preferred_locale: "ar",
    })
    .select("*")
    .single();
  if (error) throw new Error("Unable to create the authenticated user's profile.");
  return data as Profile;
}

export async function getCurrentRoles(userId?: string): Promise<UserRole[]> {
  const user = userId ? { id: userId } : await getCurrentUser();
  if (!user) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
  return (data ?? []).map((item) => item.role as UserRole);
}

export async function hasRole(role: UserRole) {
  return (await getCurrentRoles()).includes(role);
}

export async function requireRole(role: UserRole) {
  const user = await requireAuth();
  if (!(await hasRole(role))) redirect("/admin/unauthorized");
  return user;
}

export async function requireAnyRole(roles: readonly UserRole[]) {
  const user = await requireAuth();
  const currentRoles = await getCurrentRoles(user.id);
  if (!roles.some((role) => currentRoles.includes(role))) redirect("/admin/unauthorized");
  return user;
}

export async function hasPermission(permission: Permission) {
  return roleHasPermission(await getCurrentRoles(), permission);
}

export async function requirePermission(permission: Permission) {
  const user = await requireAuth();
  if (!(await hasPermission(permission))) redirect("/admin/unauthorized");
  return user;
}
