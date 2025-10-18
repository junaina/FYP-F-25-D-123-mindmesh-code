"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { LucideIcon } from "lucide-react";

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  href?: string;
  collapsed?: boolean;
}

export default function SidebarItem({
  icon: Icon,
  label,
  href = "#",
  collapsed = false,
}: SidebarItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center justify-items-center gap-2 px-4 py-2 rounded-md text-sm hover:bg-muted transition"
      )}
    >
      <Icon className="h-5 w-5" />
      {!collapsed && <span>{label}</span>}
    </Link>
  );
}
