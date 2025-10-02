"use client";

import type { Column } from "./types";
import { Eye, EyeOff } from "lucide-react";

export default function PropertiesPanel({
  open,
  columns,
  onToggle,
  onClose,
}: {
  open: boolean;
  columns: Column[];
  onToggle: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <div
      className={`fixed top-0 right-0 h-full w-80 bg-[#151515] border-l border-gray-700 transition-transform duration-200 ${
        open ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-700">
        <button onClick={onClose} className="text-gray-400 hover:text-gray-200">←</button>
        <div className="font-medium">Properties</div>
      </div>
      <div className="p-3">
        <div className="text-xs text-gray-400 mb-2">Shown in table</div>
        <div className="space-y-1">
          {columns.map(c => (
            <div key={c.id} className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-gray-800/60">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-300">{c.name}</span>
              </div>
              <button className="text-gray-400 hover:text-gray-200" onClick={() => onToggle(c.id)} title={c.visible ? "Hide" : "Show"}>
                  {c.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
