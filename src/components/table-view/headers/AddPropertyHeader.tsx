"use client";
import React from "react";

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
      {showPlus && <button className="icon-btn" onClick={onOpenAddMenu}>＋</button>}
      {showEllipsis && <button className="icon-btn" onClick={onOpenPanel}>⋯</button>}
      <style>{`
        .icon-btn{color:#a3a3a3;border-radius:8px;padding:2px 6px}
        .icon-btn:hover{background:#1f1f1f;color:#fff}
      `}</style>
    </div>
  );
}
