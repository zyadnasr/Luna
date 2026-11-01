import Image from "next/image";

export function LogoMark({ size = 48 }: { size?: number }) {
  return (
    <span
      className="inline-flex aspect-square shrink-0 overflow-hidden rounded-[0.82rem] border border-[var(--color-border)] bg-[var(--color-brand-primary)] shadow-[var(--shadow-card)]"
      style={{ width: size, height: size }}
    >
      <Image
        src="/assets/luna_logo.png"
        alt="Luna Healthy"
        width={size}
        height={size}
        priority
        className="h-full w-full object-cover"
      />
    </span>
  );
}
