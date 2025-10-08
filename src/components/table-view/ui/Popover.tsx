"use client";

import React from "react";
import { createPortal } from "react-dom";

type Placement = "bottom-start" | "bottom-end" | "top-start" | "top-end";

export default function Popover({
  anchorRef,
  open,
  onClose,
  children,
  offset = 8,
  preferred = "bottom-start",
  zIndex = 60_000,
}: {
  anchorRef: React.RefObject<Element>;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  offset?: number;
  preferred?: Placement;
  zIndex?: number;
}) {
  const boxRef = React.useRef<HTMLDivElement>(null);
  const [pos, setPos] = React.useState<{ top: number; left: number } | null>(null);

  // close on outside click / ESC
  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const a = anchorRef.current;
      const b = boxRef.current;
      if (!a || !b) return;
      if (!a.contains(e.target as Node) && !b.contains(e.target as Node)) onClose();
    };
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open, onClose, anchorRef]);

  const compute = React.useCallback(() => {
    const a = anchorRef.current;
    const b = boxRef.current;
    if (!a || !b) return;

    const ar = a.getBoundingClientRect();
    const br = b.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // decide vertical: flip if not enough space below
    const wantBottom = preferred.startsWith("bottom");
    const enoughBelow = ar.bottom + offset + br.height <= vh - 8;
    const openBottom = wantBottom ? enoughBelow : ar.top - offset - br.height < 8 ? true : false;

    // decide horizontal align
    const start = preferred.endsWith("start");

    let top = openBottom ? ar.bottom + offset : ar.top - br.height - offset;
    let left = start ? ar.left : ar.right - br.width;

    // clamp to viewport
    if (left + br.width > vw - 8) left = vw - br.width - 8;
    if (left < 8) left = 8;
    if (top + br.height > vh - 8) top = vh - br.height - 8;
    if (top < 8) top = 8;

    setPos({ top, left });
  }, [anchorRef, preferred, offset]);

  React.useLayoutEffect(() => {
    if (!open) return;
    compute();
  }, [open, compute, children]);

  React.useEffect(() => {
    if (!open) return;
    const handler = () => compute();
    window.addEventListener("resize", handler, { passive: true });
    window.addEventListener("scroll", handler, { passive: true });
    return () => {
      window.removeEventListener("resize", handler);
      window.removeEventListener("scroll", handler);
    };
  }, [open, compute]);

  if (!open) return null;
  return createPortal(
    <div
      ref={boxRef}
      style={{ position: "fixed", top: pos?.top ?? -9999, left: pos?.left ?? -9999, zIndex }}
      // let the menu receive clicks (not blocked by wrappers)
      className="pointer-events-auto"
    >
      {children}
    </div>,
    document.body
  );
}
