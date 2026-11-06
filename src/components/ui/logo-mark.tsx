import Image from "next/image";

export function LogoMark({ size = 48, variant = "full" }: { size?: number; variant?: "full" | "icon" }) {
  return (
    <span
      className={`inline-flex aspect-square shrink-0 overflow-hidden border border-[var(--color-border)] bg-[var(--color-brand-primary)] shadow-[var(--shadow-card)] ${variant === "icon" ? "rounded-full" : "rounded-[0.82rem]"}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={variant === "icon" ? "/assets/logo-circule.png" : "/assets/luna_logo.png"}
        alt="Luna Healthy"
        width={size}
        height={size}
        priority
        className="h-full w-full object-cover"
      />
    </span>
  );
}
