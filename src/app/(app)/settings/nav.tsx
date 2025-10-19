"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/settings", label: "Profile" },
  { href: "/settings/account", label: "Account" },
  { href: "/settings/preferences", label: "Preferences" },
  { href: "/settings/danger", label: "Danger Zone" },
];

export default function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {items.map((it) => {
        const active = pathname === it.href; // exact match
        return (
          <Link
            key={it.href}
            href={it.href}
            className={[
              "px-3 py-2 rounded-md text-sm font-medium",
              active
                ? "bg-[color-mix(in_oklab,var(--muted)_85%,transparent)]"
                : "hover:bg-muted",
            ].join(" ")}
            aria-current={active ? "page" : undefined}
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
