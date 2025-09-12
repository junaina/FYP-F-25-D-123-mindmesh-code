export type PropColor =
  | "gray"
  | "pink"
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "teal"
  | "blue"
  | "indigo"
  | "violet"
  | "purple";

export type PropKind =
  | "number"
  | "text"
  | "select"
  | "multi_select"
  | "date_time"
  | "email"
  | "person"
  | "checkbox"
  | "file";

export type SelectOption = { id?: string; label: string; color?: PropColor };
export type Person = {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
};
export type FileRef = { name: string; url: string };

export type PropertyValue =
  | { kind: "number"; value: number }
  | { kind: "text"; value: string; color?: PropColor }
  | { kind: "select"; value: SelectOption | null }
  | { kind: "multi_select"; value: SelectOption[] }
  | { kind: "date_time"; value: { start: string; end?: string } }
  | { kind: "email"; value: string }
  | { kind: "person"; value: Person | null }
  | { kind: "checkbox"; value: boolean }
  | { kind: "file"; value: FileRef[] };

export type Property = {
  id: string;
  name: string; // user-facing field name
  value: PropertyValue;
  color?: PropColor; // optional default chip color
};

export type CalendarItem = {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  createdAt: string;
  properties?: Record<string, Property>;
};
