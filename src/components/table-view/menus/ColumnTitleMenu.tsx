"use client";

export default function ColumnTitleMenu({ onClose }: { onClose: () => void }) {
  return (
    <div className="z-40 w-64 rounded-xl border border-gray-700 bg-[#1B1B1B] p-2 shadow-2xl">
      <div className="px-2 py-1 text-sm text-gray-300">Name</div>
      <div className="my-2 h-px bg-gray-700" />
      <button className="menu-item" onClick={onClose}>
        Filter
      </button>
      <button className="menu-item" onClick={onClose}>
        Sort
      </button>
      <style>{`
        .menu-item{display:block;width:100%;text-align:left;padding:8px 10px;border-radius:10px;color:#d1d5db}
        .menu-item:hover{background:#2a2a2a;color:#fff}
      `}</style>
    </div>
  );
}
