export type PropertyType =
  | "text"
  | "number"
  | "email"
  | "url"
  | "checkbox"
  | "date_time"
  | "select"
  | "status"
  | "multi_select"
  | "person"
  | "file";

export type PropertyOption = {
  id: string;
  value: string;
  color?: string | null;
  position?: number | null;
};

export type ColumnDef = {
  id: string; // propertyId
  name: string;
  type: PropertyType;
  options?: PropertyOption[];
};

export type Row = {
  id: string; // docId
  title: string;
  values: Record<string, unknown>; // [propertyId]: value
};

export type RowsPage = { rows: Row[]; nextCursor: string | null };
