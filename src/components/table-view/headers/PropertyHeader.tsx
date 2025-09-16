"use client";

import React from "react";
import type { Column } from "../types";
import { iconForType } from "../state";

export default function PropertyHeader({
  column,
  onRename,
  onOpenPanel,
  onOpenAddMenu,
}: {
  column: Column;
  onRename: (id: string, name: string) => void;
  onOpenPanel: () => void;
  onOpenAddMenu: (e: React.MouseEvent) => void;
}) {
  return (
    <div className="relative flex items-center gap-2 px-4 py-3 border-b border-gray-800 bg-[#141414]">
      <div className="flex items-center gap-2 text-gray-300">
        <span className="rounded-md border border-gray-700 px-1 text-xs">{iconForType(column.type)}</span>
        <input
          value={column.name}
          onChange={e => onRename(column.id, e.target.value)}
          className="bg-transparent outline-none font-medium w-40"
        />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <button className="icon-btn" onClick={onOpenAddMenu}>＋</button>
        <button className="icon-btn" onClick={onOpenPanel}>⋯</button>
      </div>
      <style>{`.icon-btn{color:#a3a3a3;border-radius:8px;padding:2px 6px}.icon-btn:hover{background:#1f1f1f;color:#fff}`}</style>
    </div>
  );
}
