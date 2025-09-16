// src/components/wiki/ui/Chip.tsx
import { X } from "lucide-react";

export function Chip({
  label,
  color,
  onRemove,
  className = "",
}: {
  label: string;
  color?: string | null;
  onRemove?: () => void;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs border ${className}`}
      style={
        color ? { background: `${color}22`, borderColor: color, color } : {}
      }
    >
      <span className="truncate max-w-[10rem]">{label}</span>
      {onRemove && (
        <button className="opacity-70 hover:opacity-100" onClick={onRemove}>
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}
