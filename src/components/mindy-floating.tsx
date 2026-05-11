"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import * as React from "react";

type Pos = { left: number; top: number };

export function MindyFloating({ projectId }: { projectId: string }) {
  const router = useRouter();
  const btnRef = React.useRef<HTMLButtonElement | null>(null);

  // start at a safe default (bottom-right) even before measuring
  const [pos, setPos] = React.useState<Pos>(() => ({
    left: 0,
    top: 0,
  }));

  const draggingRef = React.useRef(false);
  const movedRef = React.useRef(false);
  const startRef = React.useRef({ x: 0, y: 0, left: 0, top: 0 });

  const clamp = React.useCallback((left: number, top: number) => {
    const margin = 8;

    // fall back to 56 (h-14 w-14) if ref isn't ready yet
    const w = btnRef.current?.offsetWidth ?? 56;
    const h = btnRef.current?.offsetHeight ?? 56;

    const maxLeft = window.innerWidth - w - margin;
    const maxTop = window.innerHeight - h - margin;

    return {
      left: Math.min(Math.max(left, margin), maxLeft),
      top: Math.min(Math.max(top, margin), maxTop),
    };
  }, []);

  // On mount: place bottom-right and clamp (runs every refresh)
  React.useEffect(() => {
    const margin = 20;
    const w = btnRef.current?.offsetWidth ?? 56;
    const h = btnRef.current?.offsetHeight ?? 56;

    setPos(clamp(window.innerWidth - w - margin, window.innerHeight - h - margin));
  }, [clamp]);

  // Always keep it in viewport on resize (and after any layout changes)
  React.useEffect(() => {
    const onResize = () => setPos((p) => clamp(p.left, p.top));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [clamp]);

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;

    draggingRef.current = true;
    movedRef.current = false;

    startRef.current = { x: e.clientX, y: e.clientY, left: pos.left, top: pos.top };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!draggingRef.current) return;

    const dx = e.clientX - startRef.current.x;
    const dy = e.clientY - startRef.current.y;

    if (!movedRef.current && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
      movedRef.current = true;
    }

    setPos(clamp(startRef.current.left + dx, startRef.current.top + dy));
  };

  const onPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    draggingRef.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    // final safety clamp on drop
    setPos((p) => clamp(p.left, p.top));
  };

  const onClick = () => {
    if (movedRef.current) return; // don't navigate if dragged
    router.push(`/projects/${projectId}/ask-mindy`);
  };

  return (
    <button
      ref={btnRef}
      type="button"
      onClick={onClick}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className="
        fixed z-50
        h-14 w-14 rounded-full
        bg-background/80 backdrop-blur
        border shadow-md
        hover:scale-105 active:scale-95
        transition
        select-none touch-none
      "
      style={{ left: pos.left, top: pos.top }}
      aria-label="Open Ask Mindy"
      title="Ask Mindy"
    >
      <div className="relative h-full w-full">
        <Image
          src="/ask-mindy.png"
          alt="Mindy"
          fill
          className="object-contain p-2"
          priority={false}
        />
      </div>
    </button>
  );
}
