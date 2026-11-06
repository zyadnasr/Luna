"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const smoothstep = (edge0: number, edge1: number, value: number) => {
  const t = clamp((value - edge0) / (edge1 - edge0 || 1), 0, 1);
  return t * t * (3 - 2 * t);
};

export function ScrollExpandHero({
  src,
  alt,
  title,
  scrollHint,
  children,
}: {
  src: string;
  alt: string;
  title?: ReactNode;
  scrollHint?: string;
  children: ReactNode;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    if (!root || !stage) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let animationFrame = 0;

    const applyProgress = () => {
      animationFrame = 0;
      if (reducedMotion.matches) {
        stage.style.setProperty("--scroll-expand-progress", "1");
        stage.style.setProperty("--scroll-expand-top", "0%");
        stage.style.setProperty("--scroll-expand-side", "0%");
        stage.style.setProperty("--scroll-expand-radius", "0px");
        stage.style.setProperty("--scroll-expand-zoom", "1");
        if (titleRef.current) titleRef.current.style.opacity = "0";
        if (overlayRef.current) {
          overlayRef.current.style.opacity = "1";
          overlayRef.current.style.pointerEvents = "auto";
        }
        if (scrimRef.current) scrimRef.current.style.opacity = "0.78";
        if (hintRef.current) hintRef.current.style.opacity = "0";
        return;
      }

      // Use the element's document track rather than the viewport-relative
      // rect. This keeps progress tied to the sticky stage while the page is
      // scrolling and avoids ending the animation before the frame is full.
      const scrollRange = Math.max(1, root.offsetHeight - window.innerHeight);
      const bounds = root.getBoundingClientRect();
      const progress = clamp(-bounds.top / scrollRange, 0, 1);
      const isMobile = window.innerWidth < 640;
      // Match the compact mobile reference state: the image starts at roughly
      // 42% of the viewport width and 58% of its height, then expands with the
      // same progress curve used by the desktop hero.
      const startTop = isMobile ? 21 : 12;
      const startSide = isMobile ? 29 : 29;
      const startRadius = isMobile ? 24 : 32;

      stage.style.setProperty("--scroll-expand-progress", progress.toFixed(4));
      stage.style.setProperty("--scroll-expand-top", `${(startTop * (1 - progress)).toFixed(3)}%`);
      stage.style.setProperty("--scroll-expand-side", `${(startSide * (1 - progress)).toFixed(3)}%`);
      stage.style.setProperty("--scroll-expand-radius", `${(startRadius * (1 - progress)).toFixed(3)}px`);
      stage.style.setProperty("--scroll-expand-zoom", (1.35 - 0.35 * progress).toFixed(4));

      const titleOut = smoothstep(0.22, 0.72, progress);
      if (titleRef.current) {
        titleRef.current.style.opacity = `${1 - titleOut}`;
        titleRef.current.style.transform =
          `translate3d(0, ${-32 * titleOut}px, 0) scale(${1 + 0.04 * titleOut})`;
      }

      const overlayIn = smoothstep(0.62, 1, progress);
      if (overlayRef.current) {
        overlayRef.current.style.opacity = `${overlayIn}`;
        overlayRef.current.style.transform =
          `translate3d(0, ${24 * (1 - overlayIn)}px, 0)`;
        overlayRef.current.style.pointerEvents = overlayIn > 0.8 ? "auto" : "none";
      }
      if (scrimRef.current) scrimRef.current.style.opacity = `${0.78 * progress}`;

      const hintOut = smoothstep(0, 0.16, progress);
      if (hintRef.current) {
        hintRef.current.style.opacity = `${1 - hintOut}`;
        hintRef.current.style.transform = `translate3d(0, ${10 * hintOut}px, 0)`;
      }
    };

    const onScroll = () => {
      if (!animationFrame) animationFrame = window.requestAnimationFrame(applyProgress);
    };

    applyProgress();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    reducedMotion.addEventListener("change", onScroll);

    return () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      reducedMotion.removeEventListener("change", onScroll);
    };
  }, []);

  return (
    <div ref={rootRef} className="scroll-expand-hero">
      <div ref={stageRef} className="scroll-expand-hero__stage">
        <div className="scroll-expand-hero__frame">
          <Image
            src={src}
            alt={alt}
            fill
            priority
            unoptimized
            sizes="100vw"
            className="object-cover"
          />
          <div ref={scrimRef} className="scroll-expand-hero__scrim" />
        </div>
        {title ? <div ref={titleRef} className="scroll-expand-hero__title">{title}</div> : null}
        <div ref={overlayRef} className="scroll-expand-hero__content">{children}</div>
        {scrollHint ? (
          <p ref={hintRef} className="scroll-expand-hero__hint">{scrollHint}</p>
        ) : null}
      </div>
    </div>
  );
}
