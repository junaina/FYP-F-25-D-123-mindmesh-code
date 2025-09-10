// src/components/sidebar/SidebarItem.tsx
interface SidebarItemProps {
  icon?: React.ReactNode;
  label: string;
  collapsed?: boolean;
  onClick?: () => void;
  active?: boolean;
}

export default function SidebarItem({
  icon,
  label,
  collapsed,
  onClick,
  active = false,
}: SidebarItemProps) {
  return (
    <div
      className={`flex items-center gap-2 px-4 py-2 cursor-pointer rounded
        ${active ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
      onClick={onClick}
      role="button"
    >
      {icon}
      {!collapsed && <span>{label}</span>}
    </div>
  );
}
