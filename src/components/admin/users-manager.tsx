"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/components/ui/locale-provider";
import { translateAdminText } from "@/i18n/admin-text";
import {
  deleteManagedUser,
  inviteManagedUser,
  updateManagedUserRoles,
  type ManagedUser,
} from "@/lib/auth/admin-actions";
import { managedRoles } from "@/lib/auth/roles";
import type { UserRole } from "@/types/domain";

const roleLabels: Record<UserRole, string> = {
  owner: "المالك",
  manager: "المدير",
  cashier: "الكاشير",
  kitchen: "المطبخ",
  inventory: "المخزون",
  accountant: "المحاسبة",
};

export function UsersManager({ initialUsers }: { initialUsers: ManagedUser[] }) {
  const { locale } = useLocale();
  const t = (value: string) => translateAdminText(locale, value);
  const router = useRouter();
  const users = initialUsers;
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [roles, setRoles] = useState<UserRole[]>(["manager"]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  function toggleRole(role: UserRole, selected: UserRole[], update: (next: UserRole[]) => void) {
    update(
      selected.includes(role) ? selected.filter((item) => item !== role) : [...selected, role],
    );
  }

  async function invite() {
    setBusy(true);
    const result = await inviteManagedUser({ email, displayName, roles });
    setMessage(t(result.message));
    if (result.success) {
      setEmail("");
      setDisplayName("");
      setRoles(["manager"]);
      router.refresh();
    }
    setBusy(false);
  }

  return (
    <div className="mx-auto mt-8 grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] lg:items-start">
      <form
        className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]"
        action={invite}
      >
        <div className="border-b border-[var(--color-border)] bg-[var(--color-background-deep)]/30 px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-brand-primary)]">
            {t("دعوة جديدة")}
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-[-0.02em]">
            {t("أضف مستخدمًا بصلاحيات محددة")}
          </h2>
        </div>
        <div className="grid gap-5 p-6">
          <p className="text-sm leading-6 text-[var(--color-text-muted)]">
            {t("ستصل للمستخدم رسالة دعوة ليكمل إنشاء كلمة المرور بنفسه.")}
          </p>
          <label className="grid gap-2 text-sm font-semibold">
            {t("الاسم الظاهر")}
            <Input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            {t("البريد الإلكتروني")}
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <fieldset className="grid gap-3">
            <legend className="text-sm font-semibold">{t("الصلاحيات")}</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {managedRoles.map((role) => (
                <label
                  className={`flex cursor-pointer items-center justify-between gap-3 rounded-[var(--radius-sm)] border px-3 py-2.5 text-sm transition ${roles.includes(role) ? "border-[var(--color-brand-primary)] bg-[var(--color-success-soft)] text-[var(--color-text-primary)]" : "border-[var(--color-border)] bg-[var(--color-background-deep)]/25 text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]"}`}
                  key={role}
                >
                  <input
                    type="checkbox"
                    checked={roles.includes(role)}
                    onChange={() => toggleRole(role, roles, setRoles)}
                    className="sr-only"
                  />
                  <span>{t(roleLabels[role])}</span>
                  <span className="text-xs text-[var(--color-brand-primary)]">
                    {roles.includes(role) ? "✓" : "+"}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          {message ? (
            <p className="text-sm" role="status">
              {message}
            </p>
          ) : null}
          <Button className="self-start" type="submit" disabled={busy}>
            {busy ? t("جارٍ الإرسال...") : t("إرسال الدعوة")}
          </Button>
        </div>
      </form>

      <section className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between gap-4 border-b border-[var(--color-border)] bg-[var(--color-background-deep)]/30 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-brand-primary)]">
              {t("الوصول الحالي")}
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-[-0.02em]">
              {t("المستخدمون والصلاحيات")}
            </h2>
          </div>
          <span className="shrink-0 rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-xs font-semibold text-[var(--color-text-secondary)]">
            {users.length}
          </span>
        </div>
        <div className="divide-y divide-[var(--color-border)]">
          {users.length ? (
            users.map((user) => <ManagedUserRow key={user.id} user={user} t={t} />)
          ) : (
            <p className="px-6 py-10 text-sm text-[var(--color-text-muted)]">
              {t("لا يوجد مستخدمون بعد")}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function ManagedUserRow({ user, t }: { user: ManagedUser; t: (value: string) => string }) {
  const router = useRouter();
  const [roles, setRoles] = useState<UserRole[]>(user.roles);
  const [busy, setBusy] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function saveRoles() {
    setBusy(true);
    const result = await updateManagedUserRoles(user.id, roles);
    setMessage(t(result.message));
    setBusy(false);
  }
  async function removeUser() {
    if (!window.confirm(t("هل تريد حذف هذا المستخدم نهائيًا؟ لا يمكن التراجع عن هذا الإجراء.")))
      return;
    setDeleteBusy(true);
    const result = await deleteManagedUser(user.id);
    setMessage(t(result.message));
    if (result.success) router.refresh();
    setDeleteBusy(false);
  }
  return (
    <div className="p-6 transition-colors hover:bg-[var(--color-background-deep)]/20">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{user.displayName}</p>
            <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border border-[var(--color-success-border)] bg-[var(--color-success-soft)] px-2 py-1 text-[0.68rem] font-semibold text-[var(--color-success)]">
              <span
                className="size-1.5 rounded-full bg-[var(--color-success)]"
                aria-hidden="true"
              />
              {user.lastSignInAt ? t("نشط") : t("لم يسجل الدخول بعد")}
            </span>
          </div>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">{user.email}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {managedRoles.map((role) => {
          const selected = roles.includes(role);
          return (
            <button
              aria-pressed={selected}
              className={`inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border px-3 py-1.5 text-xs font-semibold transition ${selected ? "border-[var(--color-text-primary)] bg-[var(--color-text-primary)] text-[var(--color-background)]" : "border-[var(--color-border)] bg-[var(--color-background-deep)]/25 text-[var(--color-text-secondary)] hover:border-[var(--color-brand-primary)] hover:text-[var(--color-text-primary)]"}`}
              key={role}
              onClick={() =>
                setRoles((current) =>
                  current.includes(role)
                    ? current.filter((item) => item !== role)
                    : [...current, role],
                )
              }
              type="button"
            >
              {selected ? "✓" : null}
              {t(roleLabels[role])}
            </button>
          );
        })}
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-[var(--color-border)] pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={saveRoles}
          disabled={busy || !roles.length}
        >
          {busy ? t("جارٍ الحفظ...") : t("حفظ الصلاحيات")}
        </Button>
        {message ? (
          <span className="text-xs text-[var(--color-text-muted)]" role="status">
            {message}
          </span>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          className="text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)]"
          onClick={removeUser}
          disabled={busy || deleteBusy}
        >
          {deleteBusy ? t("جارٍ الحذف...") : t("حذف المستخدم")}
        </Button>
      </div>
    </div>
  );
}
