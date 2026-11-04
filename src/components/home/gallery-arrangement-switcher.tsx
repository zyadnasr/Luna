"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { GalleryArrangement, HomepageImage } from "@/lib/site/homepage";

export function GalleryArrangementSwitcher({
  images,
  arrangement = "coverflow",
}: {
  images: HomepageImage[];
  arrangement?: GalleryArrangement;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);
  const pointerStart = useRef<number | null>(null);
  const wheelDistance = useRef(0);
  const wheelResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const count = images.length;

  const move = useCallback(
    (direction: 1 | -1) => {
      if (count < 2) return false;
      const nextIndex = activeIndexRef.current + direction;
      if (nextIndex < 0 || nextIndex >= count) return false;
      activeIndexRef.current = nextIndex;
      setActiveIndex(nextIndex);
      return true;
    },
    [count],
  );

  const selectIndex = (index: number) => {
    activeIndexRef.current = index;
    setActiveIndex(index);
    wheelDistance.current = 0;
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") move(-1);
      if (event.key === "ArrowRight") move(1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [move]);

  useEffect(() => {
    return () => {
      if (wheelResetTimer.current) clearTimeout(wheelResetTimer.current);
    };
  }, []);

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (count < 2) return;

    const distance = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    if (!distance) return;

    wheelDistance.current += distance;

    const direction = wheelDistance.current > 0 ? 1 : -1;
    const nextIndex = activeIndexRef.current + direction;
    if (nextIndex < 0 || nextIndex >= count) {
      wheelDistance.current = 0;
      return;
    }

    event.preventDefault();

    if (Math.abs(wheelDistance.current) < 42) return;

    move(direction);
    wheelDistance.current = 0;

    if (wheelResetTimer.current) clearTimeout(wheelResetTimer.current);
    wheelResetTimer.current = setTimeout(() => {
      wheelDistance.current = 0;
    }, 180);
  };

  return (
    <div
      aria-label="Homepage gallery"
      className="luna-gallery-coverflow"
      onPointerDown={(event) => {
        pointerStart.current = event.clientX;
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerUp={(event) => {
        if (pointerStart.current === null) return;
        const distance = event.clientX - pointerStart.current;
        pointerStart.current = null;
        if (Math.abs(distance) > 36) move(distance > 0 ? -1 : 1);
      }}
      onPointerCancel={() => {
        pointerStart.current = null;
      }}
      onWheel={handleWheel}
      role="region"
      tabIndex={0}
    >
      <div className="luna-gallery-coverflow__track">
        {images.map((image, index) => {
          const offset = getCircularOffset(index, activeIndex, count);
          const distance = Math.abs(offset);
          const isActive = offset === 0;

          return (
            <button
              aria-label={`Show gallery image ${index + 1}`}
              className={`luna-gallery-coverflow__card ${isActive ? "is-active" : ""}`}
              key={`${image.src}-${index}`}
              onClick={() => selectIndex(index)}
              style={getCardStyle(arrangement, offset, distance)}
              type="button"
            >
              <Image
                alt={image.alt}
                className="object-cover"
                fill
                sizes="(max-width: 639px) 66vw, (max-width: 1023px) 30vw, 19rem"
                src={image.src}
                draggable={false}
                unoptimized
              />
            </button>
          );
        })}
      </div>

      {count > 1 ? (
        <div className="luna-gallery-coverflow__controls" aria-label="Gallery slides">
          {images.map((image, index) => (
            <button
              aria-label={`Show gallery image ${index + 1}`}
              aria-pressed={activeIndex === index}
              className={activeIndex === index ? "is-active" : ""}
              key={`${image.src}-dot-${index}`}
              onClick={() => selectIndex(index)}
              type="button"
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function getCircularOffset(index: number, activeIndex: number, count: number) {
  return count ? index - activeIndex : 0;
}

function getCardStyle(
  arrangement: GalleryArrangement,
  offset: number,
  distance: number,
): CSSProperties {
  const hidden = distance > 3;
  const direction = Math.sign(offset);
  const x = arrangement === "grid" ? (offset % 2) * 22 : offset * 19;
  const y =
    arrangement === "helix" ? offset * 7 : arrangement === "grid" ? Math.floor(offset / 2) * 30 : 0;
  const rotation =
    arrangement === "row"
      ? direction * Math.min(distance * 4, 12)
      : arrangement === "barrel"
        ? direction * Math.min(distance * 22, 48)
        : arrangement === "helix"
          ? direction * Math.min(distance * 10, 28)
          : arrangement === "sphere"
            ? direction * Math.min(distance * 16, 38)
            : direction * Math.min(distance * 14, 34);
  const scale =
    arrangement === "grid"
      ? distance === 0
        ? 0.88
        : 0.74
      : distance === 0
        ? 1
        : Math.max(0.66, 0.92 - distance * 0.08);
  return {
    opacity: hidden ? 0 : Math.max(0.3, 1 - distance * 0.2),
    transform: `translate3d(calc(-50% + ${x}vw), calc(-50% + ${y}%), ${-distance * 42}px) rotateY(${rotation}deg) scale(${scale})`,
    filter: distance > 1 ? "saturate(0.72) brightness(0.76)" : "none",
    pointerEvents: hidden ? "none" : "auto",
    zIndex: 20 - distance,
  };
}
