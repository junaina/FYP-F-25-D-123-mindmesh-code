// src/components/background-grid.tsx
"use client";

import React, { useEffect, useRef } from "react";

// Allow CSS custom properties (e.g. --r, --feather) in inline styles
type StyleWithVars = React.CSSProperties &
  Record<`--${string}`, string | number>;

// Helpers: pass CSS var() strings where React expects number/union types
const cssNumber = (v: string) => v as unknown as number;
const cssBlend = (v: string) =>
  v as unknown as React.CSSProperties["mixBlendMode"];

export default function BackgroundGrid() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    const set = (x: number, y: number) => {
      el.style.setProperty("--x", `${Math.round(x * dpr) / dpr}px`);
      el.style.setProperty("--y", `${Math.round(y * dpr) / dpr}px`);
    };
    set(window.innerWidth / 2, window.innerHeight * 0.35);

    let raf: number | null = null;
    const onMove = (e: PointerEvent) => {
      if (raf != null) return;
      const { clientX, clientY } = e;
      raf = requestAnimationFrame(() => {
        set(clientX, clientY);
        raf = null;
      });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      if (raf != null) cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      style={
        {
          ["--r"]: "170px", // outer radius
          ["--feather"]: "80px", // soft edge width
          contain: "layout paint style",
        } as StyleWithVars
      }
    >
      {/* CORE */}
      <div
        className="absolute inset-0"
        style={
          {
            backgroundImage: `
              linear-gradient(to right, color-mix(in oklab, var(--grid-line) 100%, transparent) 1px, transparent 1px),
              linear-gradient(to bottom, color-mix(in oklab, var(--grid-line) 100%, transparent) 1px, transparent 1px)
            `,
            backgroundSize: "22px 22px",
            opacity: cssNumber("var(--grid-core)"), // 0 in light, visible in dark
            clipPath:
              "circle(calc(var(--r) - var(--feather) * 0.6) at var(--x) var(--y))",
            willChange: "clip-path, opacity",
            transform: "translateZ(0)",
            mixBlendMode: cssBlend("var(--grid-blend)"),
          } as StyleWithVars
        }
      />

      {/* MID */}
      <div
        className="absolute inset-0"
        style={
          {
            backgroundImage: `
              linear-gradient(to right, color-mix(in oklab, var(--grid-line) 100%, transparent) 1px, transparent 1px),
              linear-gradient(to bottom, color-mix(in oklab, var(--grid-line) 100%, transparent) 1px, transparent 1px)
            `,
            backgroundSize: "22px 22px",
            opacity: cssNumber("calc(var(--grid-core) * 0.8)"),
            clipPath:
              "circle(calc(var(--r) - var(--feather)) at var(--x) var(--y))",
            willChange: "clip-path, opacity",
            transform: "translateZ(0)",
            mixBlendMode: cssBlend("var(--grid-blend)"),
          } as StyleWithVars
        }
      />

      {/* EDGE */}
      <div
        className="absolute inset-0"
        style={
          {
            backgroundImage: `
              linear-gradient(to right, color-mix(in oklab, var(--grid-line) 100%, transparent) 1px, transparent 1px),
              linear-gradient(to bottom, color-mix(in oklab, var(--grid-line) 100%, transparent) 1px, transparent 1px)
            `,
            backgroundSize: "22px 22px",
            opacity: cssNumber("calc(var(--grid-core) * 0.4)"),
            clipPath: "circle(var(--r) at var(--x) var(--y))",
            willChange: "clip-path, opacity",
            transform: "translateZ(0)",
            mixBlendMode: cssBlend("var(--grid-blend)"),
          } as StyleWithVars
        }
      />

      {/* soft brand glow (0 in light) */}
      <div
        className="absolute -top-1/3 left-1/2 h-[120vh] w-[80vw] -translate-x-1/2 rotate-[12deg]"
        style={
          {
            opacity: cssNumber("var(--glow-opacity)"),
            background:
              "radial-gradient(40% 60% at 50% 50%, color-mix(in oklab, var(--brand, var(--accent)) 10%, transparent), transparent 60%)",
            filter: "blur(40px)",
          } as StyleWithVars
        }
      />

      {/* vignette (0 in light) */}
      <div
        className="absolute inset-0"
        style={
          {
            opacity: cssNumber("var(--vignette-opacity)"),
            background:
              "radial-gradient(1200px 600px at 50% -10%, rgba(0,0,0,0) 30%, rgba(0,0,0,1) 70%)",
          } as StyleWithVars
        }
      />
    </div>
  );
}
