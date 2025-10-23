"use client";

import * as React from "react";

type DeviceLaptopProps = {
  className?: string;
  children: React.ReactNode;
  label?: string; // optional tiny label on the top bar
};

export default function DeviceLaptop({
  className = "",
  children,
  label,
}: DeviceLaptopProps) {
  return (
    <div className={`relative mx-auto w-full max-w-[640px] ${className}`}>
      {/* lid / bezel */}
      <div className="relative rounded-[18px] border border-black/5 bg-white shadow-[0_6px_40px_rgba(0,0,0,0.08)] ring-1 ring-black/5 dark:border-border dark:bg-card dark:shadow-none dark:ring-0">
        {/* camera dot + top pill */}
        <div className="flex items-center gap-2 border-b border-black/5 px-4 py-2 dark:border-border/70">
          <span className="h-2.5 w-2.5 rounded-full bg-[--accent]" />
          <span className="h-2.5 w-24 rounded bg-zinc-200 dark:bg-zinc-700" />
          {label ? (
            <span className="ml-auto text-[11px] text-zinc-500 dark:text-zinc-400">
              {label}
            </span>
          ) : null}
        </div>

        {/* screen */}
        <div className="relative h-[420px] overflow-hidden rounded-b-[18px] bg-zinc-50 dark:bg-card">
          {children}
        </div>
      </div>

      {/* hinge / base */}
      <div className="pointer-events-none mx-auto mt-1 h-[14px] w-[88%] rounded-b-[14px] bg-gradient-to-b from-zinc-200 to-zinc-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] dark:from-zinc-700 dark:to-zinc-800" />

      {/* shadow */}
      <div className="pointer-events-none mx-auto h-6 w-[96%] rounded-[20px] bg-black/5 blur-[10px] dark:hidden" />
    </div>
  );
}
