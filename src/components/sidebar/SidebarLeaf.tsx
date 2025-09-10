// src/components/sidebar/SidebarLeaf.tsx
interface SidebarLeafProps {
  label: string;
  onClick: () => void;
}

export default function SidebarLeaf({ label, onClick }: SidebarLeafProps) {
  return (
    <div
      className="ml-4 px-4 py-1 text-sm cursor-pointer rounded hover:bg-accent"
      onClick={onClick}
      role="button"
    >
      {label}
    </div>
  );
}
