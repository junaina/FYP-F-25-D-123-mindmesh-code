"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import Sidebar from "@/components/sidebar";

const DESKTOP = "(min-width: 1024px)";

export default function SidebarPortal() {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    document.body.classList.add("has-app-sb");

    let ro: ResizeObserver | null = null;
    const mql = window.matchMedia(DESKTOP);

    const applyPadding = () => {
      const el = document.querySelector<HTMLElement>("[data-app-sidebar]");
      const px = el && mql.matches ? `${el.offsetWidth}px` : "0px";
      document.body.style.setProperty("--sb-w", px);
      document.body.style.paddingLeft = px;
    };

    const hookUpObservers = (el: HTMLElement) => {
      // 1) set now
      applyPadding();
      // 2) keep in sync on collapse/expand
      ro = new ResizeObserver(applyPadding);
      ro.observe(el);
      // 3) keep in sync on breakpoint change
      mql.addEventListener("change", applyPadding);
      // 4) window resize (optional but harmless)
      window.addEventListener("resize", applyPadding);
    };

    // Wait for the sidebar element to exist
    const elNow = document.querySelector<HTMLElement>("[data-app-sidebar]");
    if (elNow) {
      hookUpObservers(elNow);
    } else {
      // If it's not there yet, watch DOM until it appears
      const mo = new MutationObserver(() => {
        const el = document.querySelector<HTMLElement>("[data-app-sidebar]");
        if (el) {
          mo.disconnect();
          hookUpObservers(el);
        }
      });
      mo.observe(document.body, { childList: true, subtree: true });
    }

    return () => {
      document.body.classList.remove("has-app-sb");
      document.body.style.removeProperty("--sb-w");
      document.body.style.removeProperty("padding-left");
      ro?.disconnect();
      mql.removeEventListener("change", applyPadding);
      window.removeEventListener("resize", applyPadding);
    };
  }, []);

  if (!mounted) return null;
  return createPortal(<Sidebar />, document.body);
}
