// src/components/sidebar/SidebarSubmenu.tsx
import { ChevronDown, ChevronRight } from "lucide-react";

interface SidebarSubmenuProps {
  label: string;
  items: string[];
  expanded: boolean;
  onToggle: () => void;
  onClick: (item: string) => void;
}

export default function SidebarSubmenu({
  label,
  items,
  expanded,
  onToggle,
  onClick,
}: SidebarSubmenuProps) {
  return (
    <div className="mb-2">
      <div
        className="flex items-center justify-between px-4 py-1 text-xs font-semibold uppercase text-muted-foreground cursor-pointer select-none"
        onClick={onToggle}
      >
        <span>{label}</span>
        {expanded ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
      </div>

      {expanded && items.length > 0 && (
        <ul>
          {items.map((item) => (
            <li
              key={item}
              className="ml-4 px-4 py-1 text-sm hover:bg-accent cursor-pointer rounded"
              onClick={() => onClick(item)}
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
