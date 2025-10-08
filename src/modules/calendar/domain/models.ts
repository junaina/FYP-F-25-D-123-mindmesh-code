// src/modules/calendar/domain/models.ts
export type CalendarBindings = {
  single?: string; // default "date"  (single-day)
  start?: string; // default "start" (range)
  end?: string; // default "end"   (range)
};

export const DEFAULT_BINDINGS: CalendarBindings = {
  single: "date",
  start: "start",
  end: "end",
};

export type CalendarInstance = {
  instanceId: string;
  documentId: string;
  title: string;
  start: string; // ISO (for single-day we mirror start=end)
  end: string; // ISO
  isRange: boolean;
  properties: Record<string, unknown>; // keyed by propertyId → { type, value } from service
  createdAt?: string;
  updatedAt?: string;
};
