"use client";
import Link from "next/link";
import { cn } from "@/lib/utils"; // if you have a cn helper; else inline classNames
import { Separator } from "@/components/ui/separator";

type SettingsLayoutProps = {
  active?: "profile" | "account" | "preferences" | "danger";
  children: React.ReactNode;
};
const NAV = [
  { key: "profile", label: "Profile", href: "/settings" },
  { key: "account", label: "Account", href: "/settings/account" },
  { key: "preferences", label: "Preferences", href: "/settings/preferences" },
  { key: "danger", label: "Danger Zone", href: "/settings/danger" },
] as const;

export default function SettingsLayout({
  active = "profile",
  children,
}: SettingsLayoutProps) {
  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="text-2xl font-semibold mb-4">Settings</div>
      <div className="grid grid-cols-12 gap-6">
        {/*Left Nav*/}
        <aside className="col-span-12 md:col-span-3">
          <nav className="space-y-1">
            {NAV.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={cn(
                  "block px-3 py-2 text-sm mm-settings-navitem hover:bg-muted",
                  active === item.key
                    ? "mm-settings-navitem--active"
                    : "text-muted-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        {/* Content */}
        <main className="col-span-12 md:col-span-9">{children}</main>
      </div>
    </div>
  );
}
