export default function AdminLoading() {
  return (
    <div className="grid gap-6" role="status" aria-label="Loading admin workspace">
      <div className="h-4 w-24 animate-pulse rounded-full bg-[var(--color-nav-active-bg)]" />
      <div className="h-12 w-2/3 animate-pulse rounded-[var(--radius-sm)] bg-[var(--color-surface)]" />
      <div className="grid gap-5 md:grid-cols-2">
        <div className="h-48 animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface)]" />
        <div className="h-48 animate-pulse rounded-[var(--radius-lg)] bg-[var(--color-surface)]" />
      </div>
    </div>
  );
}
