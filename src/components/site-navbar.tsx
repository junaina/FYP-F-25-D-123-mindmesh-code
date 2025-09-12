"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import Logo from "./logo";
import ThemeToggle from "./theme-toggle";
import { Menu, X } from "lucide-react";

export default function SiteNavbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Hide auth links on auth pages
  const hideAuthLinks = pathname === "/login" || pathname === "/signup";

  // Close mobile menu whenever the route changes
  useEffect(() => setOpen(false), [pathname]);

  const toggle = () => setOpen((v) => !v);
  const close = () => setOpen(false);

  return (
    <header className="relative z-40">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        {/* Logo (slightly larger on md+) */}
        <div className="flex items-center">
          <div className="md:hidden">
            <Logo size={44} />
          </div>
          <div className="hidden md:block">
            <Logo size={80} />
          </div>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-3">
          {!hideAuthLinks && (
            <>
              <Link href="/login">
                <Button variant="outline" className="h-9 px-3">
                  Login
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="outline" className="h-9 px-4">
                  Sign Up
                </Button>
              </Link>
            </>
          )}
          <ThemeToggle />
        </nav>

        {/* Mobile actions: theme + menu button (menu only if there are links) */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          {!hideAuthLinks && (
            <button
              type="button"
              aria-label="Open menu"
              aria-expanded={open}
              aria-controls="mobile-nav"
              onClick={toggle}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-input bg-background hover:bg-muted"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile menu panel (only when there are auth links to show) */}
      {!hideAuthLinks && (
        <div
          id="mobile-nav"
          className={`md:hidden absolute inset-x-0 top-full border-b bg-background/90 backdrop-blur transition-[opacity,transform] ${
            open
              ? "pointer-events-auto translate-y-0 opacity-100"
              : "pointer-events-none -translate-y-2 opacity-0"
          }`}
        >
          <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
            <div className="grid grid-cols-1 gap-2">
              <Link href="/login" onClick={close}>
                <Button
                  variant="outline"
                  className="w-full h-10 justify-center"
                >
                  Login
                </Button>
              </Link>
              <Link href="/signup" onClick={close}>
                <Button
                  variant="outline"
                  className="w-full h-10 justify-center"
                >
                  Sign Up
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
