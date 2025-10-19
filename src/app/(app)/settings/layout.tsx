import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils"; // or inline a tiny cn helper
import { Settings as SettingsIcon } from "lucide-react";
import SettingsNav from "./nav"; // small client component below

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[calc(100vh-0px)]">
      {" "}
      {/* full height area */}
      <div className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold mb-6 flex items-center gap-2">
          <SettingsIcon className="h-5 w-5" />
          Settings
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">
          {/* Left nav (persistent across tabs) */}
          <aside className="rounded-lg border p-2">
            <SettingsNav />
          </aside>

          {/* Right: tab content */}
          <main className="rounded-lg border p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
