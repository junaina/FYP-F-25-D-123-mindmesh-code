"use client";

import { PROPERTY_CATALOG } from "../state";
import type { ColumnType } from "../types";
import { iconForType } from "../state";

export default function AddPropertyMenu({ onPick }: { onPick: (type: ColumnType) => void }) {
  return (
    <div className="z-40 w-72 rounded-xl border border-gray-700 bg-[#1B1B1B] p-1 shadow-2xl max-h-96 overflow-auto">
      {PROPERTY_CATALOG.map(item => (
        <button key={item.type} className="menu-item flex items-center gap-2" onClick={() => onPick(item.type)}>
          <span className="w-5 text-center">{iconForType(item.type)}</span>
          <span>{item.label}</span>
        </button>
      ))}
      <style>{`
        .menu-item{display:block;width:100%;text-align:left;padding:8px 10px;border-radius:10px;color:#d1d5db}
        .menu-item:hover{background:#2a2a2a;color:#fff}
      `}</style>
    </div>
  );
}
