"use client";

import { useEffect, useRef, useState } from "react";
import { Icon, type IconProps } from "@iconify/react";

/**
 * Wrapper around Iconify's Icon that pauses the SVG animation
 * until the element enters the viewport, then plays it once.
 */
export function AnimatedIcon({ className, style, ...props }: IconProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true);
          io.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <span
      ref={ref}
      className={className}
      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", verticalAlign: "middle", lineHeight: 0, ...style }}
      data-icon-active={active}
    >
      {/* key change forces icon remount (restarts animation) when it becomes active */}
      <Icon
        key={String(active)}
        {...props}
        style={{ display: "block", ...(active ? {} : { animationPlayState: "paused" }) }}
      />
    </span>
  );
}
