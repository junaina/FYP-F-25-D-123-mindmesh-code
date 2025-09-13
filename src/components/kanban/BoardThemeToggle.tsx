"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";

export default function BoardThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid SSR/CSR mismatch and muted ghost styles pre-hydration
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return (
      <div
        aria-hidden
        className="h-8 w-[88px] rounded-md bg-neutral-100 dark:bg-neutral-800 animate-pulse"
      />
    );
  }

  const isLight = resolvedTheme === "light";
  const next = isLight ? "dark" : "light";
  const Icon = isLight ? Moon : Sun;
  const label = next[0].toUpperCase() + next.slice(1);

  return (
    <Button
      type="button"
      onClick={() => setTheme(next)}
      // High-contrast chip in both themes
      className="
        h-8 gap-2 rounded-md
        border border-neutral-200 bg-neutral-100 text-neutral-900
        hover:bg-neutral-200
        dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100
        dark:hover:bg-neutral-700
        shadow-sm
      "
      aria-label={`Switch to ${label} mode`}
      title={`Switch to ${label} mode`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Button>
  );
}
