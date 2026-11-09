"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useLocale } from "@/components/ui/locale-provider";
import { createBranch, deleteBranch, setBranchActive, updateBranch, uploadBranchImage, type BranchRecord } from "@/lib/site/branches";

const copy = {
  en: {
    add: "Add branch", name: "Branch name", address: "Address", mapUrl: "Exact Google Maps link", image: "Branch image", upload: "Upload image", uploading: "Uploading…", save: "Save branch",
    current: "Current branches", empty: "No branches yet.", active: "Active", inactive: "Inactive",
    disable: "Disable", enable: "Enable", map: "Open in Maps", required: "Enter a branch name.", imageError: "Unable to upload the branch image.",
    error: "Unable to save the branch. Please try again.", edit: "Edit", cancel: "Cancel", saveChanges: "Save changes", delete: "Delete", confirmDelete: "Delete this branch permanently?", updateError: "Unable to update the branch. Please try again.", deleteError: "Unable to delete the branch. It may still be linked to orders or tables.",
  },
  ar: {
    add: "إضافة فرع", name: "اسم الفرع", address: "العنوان", mapUrl: "رابط Google Maps الدقيق", image: "صورة الفرع", upload: "رفع صورة", uploading: "جارٍ الرفع…", save: "حفظ الفرع",
    current: "الفروع الحالية", empty: "لا توجد فروع بعد.", active: "نشط", inactive: "متوقف",
    disable: "تعطيل", enable: "تفعيل", map: "فتح الخريطة", required: "اكتب اسم الفرع.", imageError: "تعذر رفع صورة الفرع.",
    error: "تعذر حفظ الفرع. حاول مرة أخرى.", edit: "تعديل", cancel: "إلغاء", saveChanges: "حفظ التعديلات", delete: "حذف", confirmDelete: "هل تريد حذف الفرع نهائيًا؟", updateError: "تعذر تعديل الفرع. حاول مرة أخرى.", deleteError: "تعذر حذف الفرع. قد يكون مرتبطًا بطلبات أو طاولات.",
  },
  it: {
    add: "Aggiungi sede", name: "Nome sede", address: "Indirizzo", mapUrl: "Link Google Maps esatto", image: "Immagine sede", upload: "Carica immagine", uploading: "Caricamento…", save: "Salva sede",
    current: "Sedi attuali", empty: "Nessuna sede disponibile.", active: "Attiva", inactive: "Disattivata",
    disable: "Disattiva", enable: "Attiva", map: "Apri in Maps", required: "Inserisci il nome della sede.", imageError: "Impossibile caricare l'immagine.",
    error: "Impossibile salvare la sede. Riprova.", edit: "Modifica", cancel: "Annulla", saveChanges: "Salva modifiche", delete: "Elimina", confirmDelete: "Eliminare definitivamente questa sede?", updateError: "Impossibile modificare la sede. Riprova.", deleteError: "Impossibile eliminare la sede. Potrebbe essere collegata a ordini o tavoli.",
  },
} as const;

export function BranchesManager({ initialBranches }: { initialBranches: BranchRecord[] }) {
  const { locale } = useLocale();
  const t = copy[locale];
  const [branches, setBranches] = useState(initialBranches);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [mapUrl, setMapUrl] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editMapUrl, setEditMapUrl] = useState("");

  const submit = () => {
    if (!name.trim()) { setError(t.required); return; }
    setError("");
    startTransition(async () => {
      try {
        const branchId = await createBranch({ name, address, mapUrl });
        if (image) await uploadBranchImage(branchId, image);
        window.location.reload();
      } catch { setError(t.error); }
    });
  };

  const uploadImage = (branchId: string, file: File | undefined) => {
    if (!file) return;
    setError("");
    setUploadingId(branchId);
    startTransition(async () => {
      try {
        const result = await uploadBranchImage(branchId, file);
        setBranches((current) => current.map((item) => item.id === branchId ? { ...item, image_url: result.imageUrl } : item));
      } catch { setError(t.imageError); }
      finally { setUploadingId(null); }
    });
  };

  const startEdit = (branch: BranchRecord) => {
    setEditingId(branch.id);
    setEditName(branch.name);
    setEditAddress(branch.address ?? "");
    setEditMapUrl(branch.map_url ?? "");
    setError("");
  };

  const saveEdit = () => {
    const branch = branches.find((item) => item.id === editingId);
    if (!branch) return;
    if (!editName.trim()) { setError(t.required); return; }
    setError("");
    startTransition(async () => {
      try {
        await updateBranch({ branchId: branch.id, locationId: branch.location_id, name: editName, address: editAddress, mapUrl: editMapUrl });
        setBranches((current) => current.map((item) => item.id === branch.id ? { ...item, name: editName.trim(), address: editAddress.trim() || null, map_url: editMapUrl.trim() || null } : item));
        setEditingId(null);
      } catch { setError(t.updateError); }
    });
  };

  const removeBranch = (branch: BranchRecord) => {
    if (!window.confirm(t.confirmDelete)) return;
    setError("");
    startTransition(async () => {
      try {
        await deleteBranch({ branchId: branch.id, locationId: branch.location_id });
        setBranches((current) => current.filter((item) => item.id !== branch.id));
        if (editingId === branch.id) setEditingId(null);
      } catch { setError(t.deleteError); }
    });
  };

  const toggle = (branch: BranchRecord) => {
    startTransition(async () => {
      try {
        await setBranchActive({ branchId: branch.id, locationId: branch.location_id, isActive: !branch.is_active });
        setBranches((current) => current.map((item) => item.id === branch.id ? { ...item, is_active: !item.is_active } : item));
      } catch { setError(t.error); }
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
      {error ? <p className="lg:col-span-2 text-sm text-[var(--color-danger)]" role="alert">{error}</p> : null}
      <section className="luna-glass rounded-[var(--radius-lg)] border border-[var(--color-border)] p-5 sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-brand-primary)]">{t.add}</p>
        <h2 className="mt-2 text-2xl font-semibold">{t.add}</h2>
        <div className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm font-semibold">{t.name}
            <input value={name} onChange={(event) => setName(event.target.value)} className="luna-input" placeholder={t.name} />
          </label>
          <label className="grid gap-2 text-sm font-semibold">{t.address}
            <textarea value={address} onChange={(event) => setAddress(event.target.value)} className="luna-input min-h-28 resize-y" placeholder={t.address} />
          </label>
          <label className="grid gap-2 text-sm font-semibold">{t.mapUrl}
            <input value={mapUrl} onChange={(event) => setMapUrl(event.target.value)} className="luna-input" placeholder="https://maps.google.com/..." type="url" />
          </label>
          <label className="grid gap-2 text-sm font-semibold">{t.image}
            <input onChange={(event) => setImage(event.target.files?.[0] ?? null)} className="luna-input text-sm" type="file" accept="image/png,image/jpeg,image/webp" />
          </label>
          <button type="button" onClick={submit} disabled={isPending} className="luna-button luna-button--primary w-full disabled:opacity-60">
            {isPending ? "…" : t.save}
          </button>
        </div>
      </section>
      <section className="luna-glass rounded-[var(--radius-lg)] border border-[var(--color-border)] p-5 sm:p-7">
        <div className="flex items-center justify-between gap-3"><h2 className="text-2xl font-semibold">{t.current}</h2><span className="rounded-full border border-[var(--color-border)] px-3 py-1 text-xs text-[var(--color-text-muted)]">{branches.length}</span></div>
        <div className="mt-5 grid gap-3">
          {branches.length ? branches.map((branch) => (
            <article key={branch.id} className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
              {branch.image_url ? <div className="relative mb-4 h-40 w-full overflow-hidden rounded-[var(--radius-md)]"><Image src={branch.image_url} alt={branch.name} fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" /></div> : null}
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0"><h3 className="text-lg font-semibold break-words">{branch.name}</h3><p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">{branch.address || "—"}</p></div>
                <span className="rounded-full border border-[var(--color-border)] px-2.5 py-1 text-xs font-semibold">{branch.is_active ? t.active : t.inactive}</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {(branch.map_url || branch.address) ? <a className="luna-button luna-button--ghost text-xs" target="_blank" rel="noreferrer" href={branch.map_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(branch.address ?? "")}`}>{t.map}</a> : null}
                <label className="luna-button luna-button--ghost cursor-pointer text-xs">
                  {uploadingId === branch.id ? t.uploading : t.upload}
                  <input className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" disabled={isPending} onChange={(event) => uploadImage(branch.id, event.target.files?.[0])} />
                </label>
                <button type="button" onClick={() => toggle(branch)} disabled={isPending} className="luna-button luna-button--ghost text-xs disabled:opacity-60">{branch.is_active ? t.disable : t.enable}</button>
                <button type="button" onClick={() => startEdit(branch)} disabled={isPending} className="luna-button luna-button--ghost text-xs disabled:opacity-60">{t.edit}</button>
                <button type="button" onClick={() => removeBranch(branch)} disabled={isPending} className="luna-button luna-button--ghost text-xs text-[var(--color-danger)] disabled:opacity-60">{t.delete}</button>
              </div>
              {editingId === branch.id ? <div className="mt-4 grid gap-3 border-t border-[var(--color-border)] pt-4">
                <label className="grid gap-2 text-sm font-semibold">{t.name}<input value={editName} onChange={(event) => setEditName(event.target.value)} className="luna-input" /></label>
                <label className="grid gap-2 text-sm font-semibold">{t.address}<textarea value={editAddress} onChange={(event) => setEditAddress(event.target.value)} className="luna-input min-h-24 resize-y" /></label>
                <label className="grid gap-2 text-sm font-semibold">{t.mapUrl}<input value={editMapUrl} onChange={(event) => setEditMapUrl(event.target.value)} className="luna-input" type="url" placeholder="https://maps.google.com/..." /></label>
                <div className="flex flex-wrap gap-2"><button type="button" onClick={saveEdit} disabled={isPending} className="luna-button luna-button--primary text-xs disabled:opacity-60">{t.saveChanges}</button><button type="button" onClick={() => setEditingId(null)} disabled={isPending} className="luna-button luna-button--ghost text-xs disabled:opacity-60">{t.cancel}</button></div>
              </div> : null}
            </article>
          )) : <p className="py-8 text-sm text-[var(--color-text-muted)]">{t.empty}</p>}
        </div>
      </section>
    </div>
  );
}
