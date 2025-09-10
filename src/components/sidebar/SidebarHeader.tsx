// src/components/sidebar/SidebarHeader.tsx
import { ChevronLeft } from "lucide-react";
import Image from "next/image";

interface SidebarHeaderProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function SidebarHeader({
  collapsed,
  onToggle,
}: SidebarHeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center gap-2">
        <Image
          src="/mindy-mascot/mindy-all-set.png" // replace with user avatar if you have it
          alt="User Avatar"
          width={32}
          height={32}
          className="rounded-full"
        />
        {!collapsed && (
          <div>
            <p className="text-sm font-medium">John Doe</p>
            <p className="text-xs text-muted-foreground">Mindmesh</p>
          </div>
        )}
      </div>

      {/* Collapse chevron only (settings icon removed) */}
      <ChevronLeft
        className={`w-4 h-4 cursor-pointer transition-transform ${
          collapsed ? "rotate-180" : ""
        }`}
        onClick={onToggle}
      />
    </div>
  );
}
