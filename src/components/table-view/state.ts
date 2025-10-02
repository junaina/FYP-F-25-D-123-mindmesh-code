import type { Column, ColumnType, Row, TableState } from "./types";

export const uid = () => Math.random().toString(36).slice(2, 10);

import React from "react";
import {
  Hash, List, Tags, ListChecks, Calendar, User, Paperclip,
  Check, Link, AtSign, Phone, Type as TypeIcon
} from "lucide-react";

export const PROPERTY_CATALOG: { label: string; type: ColumnType }[] = [
  { label: "Text", type: "text" },
  { label: "Number", type: "number" },
  { label: "Select", type: "select" },
  { label: "Multi-select", type: "multi_select" },
  { label: "Status", type: "status" },
  { label: "Date", type: "date" },
  { label: "Person", type: "person" },
  { label: "Files & media", type: "file" },
  { label: "URL", type: "url" },
  { label: "Email", type: "email" },
  { label: "Checkbox", type: "checkbox" },
  { label: "Phone", type: "phone" },
];

export function defaultValueFor(type: ColumnType): unknown {
  switch (type) {
    case "checkbox":
      return false;
    case "multi_select":
      return [] as string[];
    case "status":                     
      return "not_started";  
    default:
      return "";

  }
}

export type Action =
  | { type: "ADD_COLUMN"; payload: { type: ColumnType; name?: string } }
  | { type: "RENAME_COLUMN"; payload: { id: string; name: string } }
  | { type: "TOGGLE_COLUMN_VIS"; payload: { id: string } }
  | { type: "UPDATE_CELL"; payload: { rowId: string; columnId: string | "title"; value: unknown } }
  | { type: "ADD_ROW" }
  | { type: "DELETE_ROW"; payload: { id: string } };

export function reducer(state: TableState, action: Action): TableState {
  switch (action.type) {
    case "ADD_COLUMN": {
      const id = uid();
      const name =
        action.payload.name ??
        PROPERTY_CATALOG.find(p => p.type === action.payload.type)?.label ??
        "Property";
      const newCol: Column = { id, name, type: action.payload.type, visible: true };
      return {
        ...state,
        columns: [...state.columns, newCol],
        rows: state.rows.map(r => ({ ...r, cells: { ...r.cells, [id]: defaultValueFor(action.payload.type) } })),
      };
    }
    case "RENAME_COLUMN":
      return { ...state, columns: state.columns.map(c => (c.id === action.payload.id ? { ...c, name: action.payload.name } : c)) };
    case "TOGGLE_COLUMN_VIS":
      return { ...state, columns: state.columns.map(c => (c.id === action.payload.id ? { ...c, visible: !c.visible } : c)) };
    case "UPDATE_CELL":
      if (action.payload.columnId === "title") {
        return { ...state, rows: state.rows.map(r => (r.id === action.payload.rowId ? { ...r, title: String(action.payload.value ?? "") } : r)) };
      }
      return {
        ...state,
        rows: state.rows.map(r =>
          r.id === action.payload.rowId ? { ...r, cells: { ...r.cells, [action.payload.columnId as string]: action.payload.value } } : r,
        ),
      };
    case "ADD_ROW": {
      const id = uid();
      const cells: Record<string, unknown> = {};
      state.columns.forEach(c => (cells[c.id] = defaultValueFor(c.type)));
      return { ...state, rows: [...state.rows, { id, title: "", cells }] };
    }
    case "DELETE_ROW":
      return { ...state, rows: state.rows.filter(r => r.id !== action.payload.id) };
    default:
      return state;
  }
}


export const iconForType = (t: ColumnType): React.ReactNode => {
  const cls = "h-4 w-4";
  const map: Record<ColumnType, React.ComponentType<{ className?: string }>> = {
    text: TypeIcon,
    number: Hash,
    select: List,
    multi_select: Tags,
    status: ListChecks,
    date: Calendar,
    person: User,
    file: Paperclip,
    checkbox: Check,
    url: Link,
    email: AtSign,
    phone: Phone,
  };
  const Icon = map[t];
  return React.createElement(Icon, { className: cls });
};