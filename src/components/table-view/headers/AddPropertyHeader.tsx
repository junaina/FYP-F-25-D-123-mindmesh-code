"use client";
import React from "react";

import { Plus, MoreHorizontal } from "lucide-react";
export default function AddPropertyHeader({
  onOpenAddMenu,
  onOpenPanel,
  showPlus = true,
  showEllipsis = true,
}: {
  onOpenAddMenu: (e: React.MouseEvent) => void;
  onOpenPanel: () => void;
  showPlus?: boolean;     
  showEllipsis?: boolean; 
}) {
  return (
    <div className="relative flex items-center justify-end gap-2 px-4 py-3 border-b border-gray-800 bg-[#141414]">
      {showPlus && (
  <button className="icon-btn" onClick={onOpenAddMenu}>
    <Plus className="h-4 w-4" />
  </button>
)}
{showEllipsis && (
  <button className="icon-btn" onClick={onOpenPanel}>
    <MoreHorizontal className="h-4 w-4" />
  </button>
)}
      <style>{`
        .icon-btn{color:#a3a3a3;border-radius:8px;padding:2px 6px}
        .icon-btn:hover{background:#1f1f1f;color:#fff}
      `}</style>
    </div>
  );
}
