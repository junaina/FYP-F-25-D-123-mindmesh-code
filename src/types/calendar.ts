export type ID = string;

export type ColorName =
  | "zinc"
  | "slate"
  | "stone"
  | "gray"
  | "neutral"
  | "red"
  | "orange"
  | "amber"
  | "yellow"
  | "lime"
  | "green"
  | "emerald"
  | "teal"
  | "cyan"
  | "sky"
  | "blue"
  | "indigo"
  | "violet"
  | "purple"
  | "fuchsia"
  | "pink"
  | "rose";

export type PropertyKind =
  | "text"
  | "number"
  | "select"
  | "multi_select"
  | "status"
  | "date"
  | "person"
  | "checkbox"
  | "url";

export type SelectOption = { id: ID; label: string; color?: ColorName };

export type PropertySchema = {
  id: ID;
  name: string;
  kind: PropertyKind;
  options?: SelectOption[]; // for select, multi_select, status
};

export type PropertyValue =
  | { kind: "text"; value: string }
  | { kind: "number"; value: number | null }
  | { kind: "select"; optionId: ID | null }
  | { kind: "multi_select"; optionIds: ID[] }
  | { kind: "status"; optionId: ID | null }
  | { kind: "date"; value: string | null } // ISO date
  | { kind: "person"; userIds: ID[] }
  | { kind: "checkbox"; value: boolean }
  | { kind: "url"; value: string | null };

export type Person = { id: ID; name: string; avatar?: string };

export type CalendarItem = {
  id: ID;
  title: string;
  date: string; // ISO start
  endDate?: string | null;
  description?: string;
  properties: Record<ID, PropertyValue>;
};

export type CalendarData = {
  title: string;
  timeZone: string;
  propertySchemas: PropertySchema[];
  people: Person[];
  items: CalendarItem[];
};

export type UpsertItem = (item: CalendarItem) => void;
export type DeleteItem = (id: ID) => void;
