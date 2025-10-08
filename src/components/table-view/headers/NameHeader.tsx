"use client";

import React from "react";
import ColumnTitleMenu from "../menus/ColumnTitleMenu";

export default function NameHeader({ onOpenPanel }: { onOpenPanel: () => void }) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="relative flex items-center gap-2 px-4 py-3 border-b border-gray-800 bg-[#141414]">
      <button className="flex items-center gap-2 text-gray-300 hover:text-white" onClick={() => setOpen(v => !v)}>
        <span className="rounded-md border border-gray-700 px-1 text-xs">Aa</span>
        <span className="font-medium">Name</span>
      </button>
      <div className="ml-auto flex items-center gap-2">
        {/* nothing here; Name stays isolated */}
        <button className="icon-btn" onClick={onOpenPanel}>⋯</button>
      </div>
      {open && (
        <div className="absolute left-3 top-12" onMouseLeave={() => setOpen(false)}>
          <ColumnTitleMenu onClose={() => setOpen(false)} />
        </div>
      )}
      <style>{`.icon-btn{color:#a3a3a3;border-radius:8px;padding:2px 6px}.icon-btn:hover{background:#1f1f1f;color:#fff}`}</style>
    </div>
  );
}
