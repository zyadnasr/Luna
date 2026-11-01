export default function Loading() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-7xl items-center justify-center px-5 py-16">
      <div className="flex items-center gap-3 text-sm text-[var(--color-text-muted)]" role="status">
        <span
          className="size-3 animate-pulse rounded-full bg-[var(--color-brand-primary)]"
          aria-hidden="true"
        />
        جارٍ تجهيز الصفحة...
      </div>
    </main>
  );
}
