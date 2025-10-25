export type CalendarBindings = {
  single?: string; 
  start?: string;
  end?: string; 
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
  start: string; 
  end: string; 
  isRange: boolean;
  properties: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};
