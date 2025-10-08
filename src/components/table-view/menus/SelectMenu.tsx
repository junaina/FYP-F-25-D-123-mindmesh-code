"use client";

import * as React from "react";

export default function SelectMenu({
  options,
  value,
  onChange,
  onCreate,
}: {
  options: string[];
  value?: string;
  onChange: (v: string) => void;
  onCreate?: (v: string) => void;
}) {
  const [q, setQ] = React.useState("");
  const filtered = options.filter((o) =>
    o.toLowerCase().includes(q.toLowerCase())
  );

  const create = () => {
    const v = q.trim();
    if (!v) return;
    onCreate?.(v);
    onChange(v);
  };

  return (
    <div className="z-50 w-72 rounded-xl border border-gray-700 bg-[#1B1B1B] shadow-2xl p-2">
      <div className="px-1 pb-2 text-sm text-gray-300">Select</div>
      <input
        className="mb-2 w-full rounded-md border border-gray-700 bg-transparent px-3 py-2 text-gray-200 placeholder-gray-500 outline-none"
        placeholder="Search for an option..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && create()}
      />
      {filtered.length === 0 ? (
        <div
          className="px-3 py-6 text-sm text-gray-400"
          onMouseDown={(e) => e.preventDefault()}
        >
          Select an option or create one
        </div>
      ) : (
        <div className="max-h-60 overflow-auto">
          {filtered.map((o) => (
            <button
              key={o}
              className={`block w-full rounded-md px-3 py-2 text-left text-sm text-gray-200 hover:bg-gray-800/60 ${
                o === value ? "bg-gray-800/60" : ""
              }`}
              onClick={() => onChange(o)}
            >
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
