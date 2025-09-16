export type ColumnType =
  | "text"
  | "number"
  | "select"
  | "multi_select"
  | "status"
  | "date"
  | "person"
  | "file"
  | "checkbox"
  | "url"
  | "email"
  | "phone";

export interface Column {
  id: string;
  name: string;
  type: ColumnType;
  visible: boolean;
}

export interface Row {
  id: string;
  title: string; // Name column
  cells: Record<string, unknown>; // key = column.id
}

export interface TableState {
  columns: Column[]; // dynamic properties (not Name)
  rows: Row[];
}

export interface TableCallbacks {
  onAddColumn?(c: Column): void;
  onRenameColumn?(id: string, name: string): void;
  onToggleColumn?(id: string, visible: boolean): void;
  onUpdateCell?(rowId: string, columnId: string | "title", value: unknown): void;
  onAddRow?(r: Row): void;
}
