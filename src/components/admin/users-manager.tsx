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
    <div className="mt-10 grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] lg:items-start">
      <form
        className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
        action={invite}
      >
        <p className="text-xs font-semibold tracking-[0.12em] text-[var(--color-text-muted)]">
          {t("دعوة جديدة")}
        </p>
        <h2 className="mt-2 text-xl font-semibold">{t("أضف مستخدمًا بصلاحيات محددة")}</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
          {t("ستصل للمستخدم رسالة دعوة ليكمل إنشاء كلمة المرور بنفسه.")}
        </p>
        <div className="mt-6 grid gap-4">
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
                  className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 py-2 text-sm"
                  key={role}
                >
                  <input
                    type="checkbox"
                    checked={roles.includes(role)}
                    onChange={() => toggleRole(role, roles, setRoles)}
                    className="size-4 accent-[var(--color-brand-primary)]"
                  />
                  {t(roleLabels[role])}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
        {message ? (
          <p className="mt-4 text-sm" role="status">
            {message}
          </p>
        ) : null}
        <Button className="mt-6" type="submit" disabled={busy}>
          {busy ? t("جارٍ الإرسال...") : t("إرسال الدعوة")}
        </Button>
      </form>

      <section className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="border-b border-[var(--color-border)] px-6 py-5">
          <p className="text-xs font-semibold tracking-[0.12em] text-[var(--color-text-muted)]">
            {t("الوصول الحالي")}
          </p>
          <h2 className="mt-2 text-xl font-semibold">{t("المستخدمون والصلاحيات")}</h2>
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
    <div className="px-6 py-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{user.displayName}</p>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">{user.email}</p>
        </div>
        <span className="text-xs text-[var(--color-text-muted)]">
          {user.lastSignInAt ? t("نشط") : t("لم يسجل الدخول بعد")}
        </span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {managedRoles.map((role) => (
          <label className="flex items-center gap-1.5 text-xs" key={role}>
            <input
              type="checkbox"
              checked={roles.includes(role)}
              onChange={() =>
                setRoles((current) =>
                  current.includes(role)
                    ? current.filter((item) => item !== role)
                    : [...current, role],
                )
              }
              className="size-3.5 accent-[var(--color-brand-primary)]"
            />
            {t(roleLabels[role])}
          </label>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-3">
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
