"use client";

import React from "react";
import type { ColumnType } from "../types";
import TagPicker from "./TagPicker";
import StatusCell from "./StatusCell";
import SelectCell from "./SelectCell";

export default function CellInput({
  type,
  value,
  onChange,
}: {
  type: ColumnType;
  value: any;
  onChange: (val: unknown) => void;
}) {
  const base =
    "w-full bg-transparent text-gray-200 placeholder-gray-500 outline-none focus:ring-0 px-3 py-2";

  if (type === "status") {
    return (
      <StatusCell
        value={value}
        onChange={(v) => onChange(v)}
      />
    );
  }

  if (type === "select") {
    return (
      <SelectCell
        value={value}
        onChange={(v) => onChange(v)}
        options={[]} // pass options from backend later; kept empty to match “create one” UX
      />
    );
  }

  if (type === "multi_select") {
    return (
      <TagPicker
        multi
        value={Array.isArray(value) ? value : []}
        onChange={onChange}
      />
    );
  }

  if (type === "checkbox") {
    return (
      <div className="flex items-center justify-center h-full">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-gray-600 bg-transparent"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
        />
      </div>
    );
  }

  if (type === "number") {
    return (
      <input
        className={base}
        inputMode="numeric"
        pattern="[0-9]*"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9.-]/g, ""))}
        placeholder="0"
      />
    );
  }

  if (type === "date") {
    return (
      <input
        className={`${base} [color-scheme:dark]`}
        type="date"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  // person, file, url, email, phone, text – generic inputs for now
  return (
    <input
      className={base}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={
        type === "url" ? "https://" : type === "email" ? "name@example.com" : ""
      }
    />
  );
}
