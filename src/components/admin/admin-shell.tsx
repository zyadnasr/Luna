"use client";

import type { ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { signOut } from "@/lib/auth/actions";
import type { Profile, UserRole } from "@/types/domain";
import { LogoMark } from "@/components/ui/logo-mark";
import { useLocale } from "@/components/ui/locale-provider";
import { AdminNotifications } from "@/components/admin/admin-notifications";
import type { StoredNotification } from "@/lib/notifications/server";

const navigation = [
  { group: "الرئيسية", items: [{ label: "نظرة عامة", href: "/admin" }] },
  {
    group: "التشغيل",
    items: [
      { label: "الطلبات", href: "/admin/orders" },
      { label: "الترابيزات", href: "/admin/tables" },
    ],
  },
  {
    group: "المنتجات والمخزون",
    items: [
      { label: "المنتجات", href: "/admin/products" },
      { label: "المخزون", href: "/admin/inventory" },
      { label: "الوصفات", href: "/admin/inventory/recipes" },
      { label: "تنبيهات المخزون", href: "/admin/inventory/alerts" },
    ],
  },
  {
    group: "الإدارة",
    items: [
      { label: "المصروفات", href: "/admin/expenses" },
      { label: "الكوبونات", href: "/admin/coupons" },
      { label: "التقارير", href: "/admin/reports" },
      { label: "المستخدمون", href: "/admin/users" },
      { label: "الإعدادات", href: "/admin/settings" },
    ],
  },
];
const roleLabels: Record<UserRole, string> = {
  owner: "المالك",
  manager: "المدير",
  cashier: "الكاشير",
  kitchen: "المطبخ",
  inventory: "المخزون",
  accountant: "المحاسبة",
};
const adminLabels = {
  en: {
    الرئيسية: "Overview",
    "نظرة عامة": "Overview",
    التشغيل: "Operations",
    الطلبات: "Orders",
    الترابيزات: "Tables",
    "المنتجات والمخزون": "Products & inventory",
    المنتجات: "Products",
    المخزون: "Inventory",
    الوصفات: "Recipes",
    "تنبيهات المخزون": "Inventory alerts",
    الإدارة: "Administration",
    المصروفات: "Expenses",
    الكوبونات: "Coupons",
    التقارير: "Reports",
    المستخدمون: "Users",
    الإعدادات: "Settings",
    "مساحة الإدارة": "Admin workspace",
    "بدون دور": "No role",
    خروج: "Sign out",
    owner: "Owner",
    manager: "Manager",
    cashier: "Cashier",
    kitchen: "Kitchen",
    inventory: "Inventory",
    accountant: "Accountant",
  },
  it: {
    الرئيسية: "Panoramica",
    "نظرة عامة": "Panoramica",
    التشغيل: "Operazioni",
    الطلبات: "Ordini",
    الترابيزات: "Tavoli",
    "المنتجات والمخزون": "Prodotti e inventario",
    المنتجات: "Prodotti",
    المخزون: "Inventario",
    الوصفات: "Ricette",
    "تنبيهات المخزون": "Avvisi inventario",
    الإدارة: "Amministrazione",
    المصروفات: "Spese",
    الكوبونات: "Coupon",
    التقارير: "Report",
    المستخدمون: "Utenti",
    الإعدادات: "Impostazioni",
    "مساحة الإدارة": "Area amministrazione",
    "بدون دور": "Nessun ruolo",
    خروج: "Esci",
    owner: "Proprietario",
    manager: "Responsabile",
    cashier: "Cassa",
    kitchen: "Cucina",
    inventory: "Inventario",
    accountant: "Contabilità",
  },
} as const;

export function AdminShell({
  children,
  user,
  profile,
  roles,
  initialNotifications,
}: {
  children: ReactNode;
  user: User;
  profile: Profile;
  roles: UserRole[];
  initialNotifications: StoredNotification[];
}) {
  const { locale } = useLocale();
  const pathname = usePathname();
  const translate = (value: string) =>
    locale === "ar" ? value : (adminLabels[locale][value as keyof typeof adminLabels.en] ?? value);
  const isArabic = locale === "ar";
  const sidebarPlacement = isArabic ? "right-0 border-l" : "left-0 border-r";
  const collapsedTransform = isArabic ? "translate-x-full" : "-translate-x-full";
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openSidebar = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setSidebarOpen(true);
  };
  const closeSidebar = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setSidebarOpen(false), 120);
  };
  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    const hasMoreSpecificMatch = navigation
      .flatMap((section) => section.items)
      .some(
        (item) =>
          item.href !== href &&
          item.href.startsWith(`${href}/`) &&
          (pathname === item.href || pathname.startsWith(`${item.href}/`)),
      );
    return (pathname === href || pathname.startsWith(`${href}/`)) && !hasMoreSpecificMatch;
  };
  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <div
        className={`pointer-events-none fixed ${sidebarPlacement.split(" ")[0]} top-20 bottom-0 z-30 hidden w-72 lg:block`}
      >
        <button
          aria-expanded={sidebarOpen}
          aria-label={translate("فتح التنقل الإداري")}
          className={`pointer-events-auto absolute top-5 ${isArabic ? "right-3" : "left-3"} grid size-11 place-items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-glass)] shadow-[var(--shadow-card)] backdrop-blur-[var(--blur-glass)] transition duration-200 hover:scale-105 hover:border-[var(--color-brand-primary)] focus:outline-none focus:ring-4 focus:ring-[var(--color-focus-ring)]`}
          onClick={() => setSidebarOpen((open) => !open)}
          onPointerEnter={openSidebar}
          onPointerLeave={closeSidebar}
          type="button"
        >
          <LogoMark size={30} />
        </button>
        <aside
          className={`pointer-events-auto absolute inset-y-0 ${sidebarPlacement} w-72 overflow-y-auto border-[var(--color-border)] bg-[var(--color-surface-glass)] px-5 py-6 shadow-[var(--shadow-inset)] backdrop-blur-[var(--blur-glass)] transition-transform duration-300 ease-out ${sidebarOpen ? "translate-x-0" : collapsedTransform}`}
          onPointerEnter={openSidebar}
          onPointerLeave={closeSidebar}
        >
          <Link href="/admin" className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)]">
              <LogoMark size={34} />
            </span>
            <span>
              <span className="block text-sm font-semibold">Luna Healthy</span>
              <span className="mt-0.5 block text-xs text-[var(--color-text-muted)]">
                {translate("مساحة الإدارة")}
              </span>
            </span>
          </Link>
          <nav className="mt-10 grid gap-7" aria-label="التنقل الإداري">
            {navigation.map((section) => (
              <div key={section.group}>
                <p className="mb-2 px-3 text-[0.68rem] font-semibold tracking-[0.12em] text-[var(--color-text-muted)]">
                  {translate(section.group)}
                </p>
                <div className="grid gap-1">
                  {section.items.map((item) => (
                    <Link
                      aria-current={isActive(item.href) ? "page" : undefined}
                      className={`rounded-[var(--radius-sm)] px-3 py-2.5 text-sm transition duration-200 ${isActive(item.href) ? "bg-[var(--color-nav-active-bg)] font-semibold text-[var(--color-nav-active-text)] shadow-[var(--shadow-card)]" : "text-[var(--color-text-secondary)] hover:bg-[var(--color-nav-active-bg)] hover:text-[var(--color-nav-active-text)]"}`}
                      href={item.href}
                      key={item.href}
                    >
                      {translate(item.label)}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </aside>
      </div>
      <div>
        <header className="sticky top-0 z-20 flex min-h-20 items-center justify-between gap-4 border-b border-[var(--color-border)] bg-[var(--color-surface-glass)] px-5 shadow-[var(--shadow-inset)] backdrop-blur-[var(--blur-glass)] sm:px-8">
          <div>
            <p className="text-xs text-[var(--color-text-muted)]">{translate("مساحة الإدارة")}</p>
            <p className="mt-1 font-semibold">{profile.display_name ?? user.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <AdminNotifications initialNotifications={initialNotifications} />
            <span className="hidden rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs font-semibold text-[var(--color-text-primary)] sm:inline-flex">
              {roles
                .map((role) => (locale === "ar" ? roleLabels[role] : adminLabels[locale][role]))
                .join(locale === "ar" ? "، " : ", ") || translate("بدون دور")}
            </span>
            <form action={signOut}>
              <button
                className="rounded-[var(--radius-pill)] border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-text-secondary)] transition hover:border-[var(--color-danger)] hover:text-[var(--color-danger)]"
                type="submit"
              >
                {translate("خروج")}
              </button>
            </form>
          </div>
        </header>
        <nav
          className="flex gap-2 overflow-x-auto border-b border-[var(--color-border)] bg-[var(--color-surface-glass)] p-3 lg:hidden"
          aria-label="التنقل الإداري للموبايل"
        >
          {navigation
            .flatMap((section) => section.items)
            .map((item) => (
              <Link
                aria-current={isActive(item.href) ? "page" : undefined}
                className={`shrink-0 rounded-[var(--radius-pill)] border border-[var(--color-border)] px-3 py-2 text-xs font-semibold transition ${isActive(item.href) ? "bg-[var(--color-nav-active-bg)] text-[var(--color-nav-active-text)]" : "text-[var(--color-text-secondary)] hover:bg-[var(--color-nav-active-bg)] hover:text-[var(--color-nav-active-text)]"}`}
                href={item.href}
                key={item.href}
              >
                {translate(item.label)}
              </Link>
            ))}
        </nav>
        <main id="admin-main" className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
          {children}
        </main>
      </div>
    </div>
  );
}
