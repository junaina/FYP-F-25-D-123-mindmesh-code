// src/app/(app)/desk/page.tsx
"use client";
import dynamic from "next/dynamic";
import { DESK_ENABLED } from "@/lib/flags";

const Desk = dynamic(() => import("@/components/desk/Desk"), { ssr: false });

export default function DeskPage() {
  if (!DESK_ENABLED) return null;
  // if your root layout adds vertical padding, subtract it here
  return (
    <div className="h-[calc(100vh-3rem)] -mx-4">
      <Desk />
    </div>
  );
}
