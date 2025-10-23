"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Moon, Sun, Menu, X } from "lucide-react";

const THEME_KEY = "mm-theme";

function ThemeToggle() {
  const [isDark, setIsDark] = useState<boolean | null>(null);

  useEffect(() => {
    const fromLS = (typeof window !== "undefined" &&
      localStorage.getItem(THEME_KEY)) as "light" | "dark" | "system" | null;

    const prefersDark =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;

    const current = fromLS || "system";
    const dark = current === "dark" || (current !== "light" && prefersDark);
    setIsDark(dark);
  }, []);

  useEffect(() => {
    if (isDark === null) return;
    const root = document.documentElement.classList;
    if (isDark) root.add("dark");
    else root.remove("dark");
    localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
    document.cookie = `${THEME_KEY}=${
      isDark ? "dark" : "light"
    }; path=/; max-age=31536000`;
  }, [isDark]);

  return (
    <button
      aria-label="Toggle theme"
      onClick={() => setIsDark((v) => !v)}
      className="mm-icon-btn"
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}

export default function SiteNavbar() {
  const [open, setOpen] = useState(false);

  // Click animation handler (no timers; uses animationend)
  const clickAnimate = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const el = e.currentTarget; // capture element now
    el.classList.add("press-anim");
    const remove = () => {
      el.classList.remove("press-anim");
      el.removeEventListener("animationend", remove);
    };
    el.addEventListener("animationend", remove);
    if (open) setOpen(false); // close mobile menu after click
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      {/* Desktop grid (md+) — 3 columns: left logo, center links, right controls */}
      <nav className="mx-auto hidden max-w-7xl grid-cols-3 items-center px-4 py-3 md:grid">
        {/* Left: Logo */}
        <div className="flex items-center gap-2 font-bold text-lg">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/mindy-mascot/mindy-all-set.png"
              alt="Mindy mascot"
              width={48}
              height={48}
              className="h-9 w-9 object-contain"
            />
            <span className="hidden sm:inline">MindMesh</span>
          </Link>
        </div>

        {/* Center: Nav links (perfectly centered, no wrapping) */}
        <ul className="flex items-center justify-center gap-6">
          <li>
            <a
              href="#features"
              className="whitespace-nowrap text-sm hover:text-foreground/80"
              onClick={clickAnimate}
            >
              Features
            </a>
          </li>
          <li>
            <a
              href="#how"
              className="whitespace-nowrap text-sm hover:text-foreground/80"
              onClick={clickAnimate}
            >
              How it works
            </a>
          </li>
          <li>
            <a
              href="#login"
              className="whitespace-nowrap text-sm hover:text-foreground/80"
              onClick={clickAnimate}
            >
              Login
            </a>
          </li>
          <li>
            <a
              href="#signup"
              className="whitespace-nowrap rounded-[var(--radius)] bg-[--accent] px-3 py-2 text-sm font-medium text-[--accent-foreground]"
              onClick={clickAnimate}
            >
              Sign Up
            </a>
          </li>
        </ul>

        {/* Right: Controls */}
        <div className="flex justify-end">
          <ThemeToggle />
        </div>
      </nav>

      {/* Mobile header (smaller screens) */}
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:hidden">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Image
            src="/mindy-mascot/mindy-all-set.png"
            alt="Mindy mascot"
            width={40}
            height={40}
            className="h-8 w-8 object-contain"
          />
          <span>mindmesh</span>
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            className="mm-icon-btn"
            aria-label="Toggle menu"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile dropdown panel */}
      {open && (
        <div className="md:hidden">
          <ul className="space-y-1 border-t bg-background px-4 py-3">
            <li>
              <a
                href="#features"
                className="block rounded-md px-2 py-2 text-sm hover:bg-muted"
                onClick={clickAnimate}
              >
                Features
              </a>
            </li>
            <li>
              <a
                href="#how"
                className="block rounded-md px-2 py-2 text-sm hover:bg-muted"
                onClick={clickAnimate}
              >
                How it works
              </a>
            </li>
            <li>
              <a
                href="#login"
                className="block rounded-md px-2 py-2 text-sm hover:bg-muted"
                onClick={clickAnimate}
              >
                Login
              </a>
            </li>
            <li>
              <a
                href="#signup"
                className="block rounded-[var(--radius)] bg-[--accent] px-2 py-2 text-sm font-medium text-[--accent-foreground]"
                onClick={clickAnimate}
              >
                Sign Up
              </a>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
