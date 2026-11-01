import type { UserRole } from "@/types/domain";

export const permissions = [
  "admin.access",
  "admin.view_dashboard",
  "orders.view",
  "orders.create",
  "orders.update",
  "orders.cancel",
  "tables.view",
  "tables.manage",
  "catalog.view",
  "catalog.manage",
  "inventory.view",
  "inventory.manage",
  "expenses.view",
  "expenses.manage",
  "reports.view",
  "users.view",
  "users.manage",
  "settings.view",
  "settings.manage",
] as const;

export type Permission = (typeof permissions)[number];

export const rolePermissions: Record<UserRole, readonly Permission[]> = {
  owner: permissions,
  manager: [
    "admin.access",
    "admin.view_dashboard",
    "orders.view",
    "orders.create",
    "orders.update",
    "orders.cancel",
    "tables.view",
    "tables.manage",
    "catalog.view",
    "inventory.view",
    "inventory.manage",
    "expenses.view",
    "expenses.manage",
    "reports.view",
  ],
  cashier: [
    "admin.access",
    "orders.view",
    "orders.create",
    "orders.update",
    "tables.view",
    "tables.manage",
  ],
  kitchen: ["admin.access", "orders.view"],
  inventory: ["admin.access", "inventory.view", "inventory.manage", "catalog.view", "reports.view"],
  accountant: ["admin.access", "expenses.view", "expenses.manage", "reports.view"],
};

export function roleHasPermission(roles: readonly UserRole[], permission: Permission) {
  return roles.some((role) => rolePermissions[role].includes(permission));
}
