"use client";

import Link from "next/link";
import type React from "react"; // <-- add the type import
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

import type { ViewConfig } from "@/components/desk/Desk";
interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  href?: string;
  collapsed?: boolean;
  /** If provided, enables drag + Alt/Middle-click to open in Desk */
  viewConfig?: ViewConfig;
  title?: string;
}

export default function SidebarItem({
  icon: Icon,
  label,
  href = "#",
  collapsed = false,
  viewConfig,
  title,
}: SidebarItemProps) {
  // Globals exposed by Desk (safe if not mounted)
  const beginDeskDrag = (globalThis as any).beginDeskDrag as
    | ((ev: DragEvent, payload: ViewConfig) => void)
    | undefined;

  // prefer openDeskDirect; fall back to openDeskTab if you left that name somewhere
  const openDeskDirect =
    ((globalThis as any).openDeskDirect as
      | ((payload: ViewConfig) => void)
      | undefined) ||
    ((globalThis as any).openDeskTab as
      | ((payload: ViewConfig) => void)
      | undefined);

  /** Alt+Click => open in Desk (prevent link nav) */
  function handleClick(e: React.MouseEvent) {
    if (!viewConfig) return;
    if (e.altKey) {
      e.preventDefault();
      e.stopPropagation();
      openDeskDirect
        ? openDeskDirect(viewConfig)
        : beginDeskDrag?.(e.nativeEvent as unknown as DragEvent, viewConfig);
    }
  }

  /** Middle-click => open in Desk (prevent browser new-tab) */
  function handleAuxClick(e: React.MouseEvent) {
    if (!viewConfig) return;
    if (e.button === 1) {
      e.preventDefault();
      e.stopPropagation();
      openDeskDirect
        ? openDeskDirect(viewConfig)
        : beginDeskDrag?.(e.nativeEvent as unknown as DragEvent, viewConfig);
    }
  }

  /** Real drag => let Desk create a tab under the cursor */
  function handleDragStart(e: React.DragEvent) {
    if (!viewConfig || !beginDeskDrag) return;
    e.dataTransfer?.setData("text/plain", viewConfig.title);
    beginDeskDrag(e.nativeEvent as unknown as DragEvent, viewConfig);
  }

  const content = (
    <div
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-md text-sm hover:bg-muted transition",
      )}
      draggable={!!viewConfig}
      onDragStart={handleDragStart}
      onClick={handleClick}
      onAuxClick={handleAuxClick}
      title={title}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

// "use client";

// import { cn } from "@/lib/utils";
// import Link from "next/link";
// import { LucideIcon } from "lucide-react";
// /** Desk view types (extend later for thread/meeting/taskboard) */
// export type ViewKind = "document" | "thread" | "meeting" | "taskboard";
// export type ViewConfig = {
//   kind: ViewKind;
//   id: string;
//   title: string;
//   params: { projectId: string; [k: string]: unknown };
// };
// interface SidebarItemProps {
//   icon: LucideIcon;
//   label: string;
//   href?: string;
//   collapsed?: boolean;
//   /** Optional: if provided, enables Alt+Click / middle-click / drag to open in Desk */
//   viewConfig?: ViewConfig;
//   /** Optional tooltip */
//   title?: string;
// }

// export default function SidebarItem({
//   icon: Icon,
//   label,
//   href = "#",
//   collapsed = false,
//   viewConfig,
//   title,
// }: SidebarItemProps) {
//   return (
//     <Link
//       href={href}
//       className={cn(
//         "flex items-center justify-items-center gap-2 px-4 py-2 rounded-md text-sm hover:bg-muted transition"
//       )}
//     >
//       <Icon className="h-5 w-5" />
//       {!collapsed && <span>{label}</span>}
//     </Link>
//   );
// }
