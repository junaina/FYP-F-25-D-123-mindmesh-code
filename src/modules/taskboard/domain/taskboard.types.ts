/**
 * Taskboard types
 *
 * This file intentionally supports BOTH:
 * 1) The current backend DTO shape (Usecase A working endpoints)
 * 2) Some legacy FE-first fields that may still be referenced in UI code
 *
 * Prefer the "Dto" types below for all new code.
 */

/* ----------------------------- Status Properties ----------------------------- */

export type StatusPropertyOptionDto = {
  id: string;
  value: string;
  color?: string | null;
  position?: number | null;
};

export type StatusPropertyDto = {
  id: string;
  name: string;
  options: StatusPropertyOptionDto[];
};

export type TaskboardStatusPropertiesResponseDto = {
  properties: StatusPropertyDto[];
  currentPropertyId: string | null;
};

/**
 * Back-compat alias (your FE/client code referenced this name)
 */
export type TaskboardStatusPropertiesDto = TaskboardStatusPropertiesResponseDto;

/* ----------------------------- Taskboard (API DTO) ---------------------------- */
/**
 * Matches GET /api/projects/:projectId/taskboard
 */

export type TaskboardBindingsDto = {
  statusPropertyId?: string | null;
};

export type TaskboardColumnDto = {
  /** status option id (stable) */
  optionId?: string;
  /** fallback if some callers still use `id` */
  id?: string;

  /** backend sends `label` (preferred) */
  label?: string;

  /** optional alias (some code uses `value`/`name`) */
  value?: string;
  name?: string;

  position?: number | null;

  /** legacy alias: some FE code used `title` */
  title?: string;
  color?: string | null;
};

export type TaskboardCardDto = {
  /** document id */
  id: string;
  documentId?: string;

  title?: string;
  description?: string | null;

  /** backend uses columnId/optionId as status option id */
  columnId?: string | null;
  optionId?: string | null;

  position?: number | null;
  assigneeIds?: string[];

  /** legacy alias used by older FE-first model */
  columnOptionId?: string | null;
};

export type TaskboardDto = {
  id: string;
  name: string;

  bindings?: TaskboardBindingsDto | null;
  columns?: TaskboardColumnDto[];
  cards?: TaskboardCardDto[];

  /**
   * Legacy fields (kept optional for compatibility).
   * New backend does NOT return these; UI now uses /status-properties.
   */
  projectId?: string;
  statusProperty?: {
    id: string;
    name: string;
    options: StatusPropertyOptionDto[];
  };
};

/* ----------------------------- Usecase DTOs (mutations) ----------------------------- */

export type UpdateTaskboardNameInputDto = {
  name: string;
};

export type CreateTaskboardColumnResponseDto = {
  id: string; // optionId
  title: string; // label/value to show in UI
};

export type CreateStatusPropertyForTaskboardInputDto = {
  name: string;
  options: string[]; // option values
};

export type CreatedStatusPropertyDto = {
  id: string;
  name: string;
  options: StatusPropertyOptionDto[];
};

export type CreateTaskboardItemInputDto = {
  propertyId: string;
  optionId: string;
  title: string;
};

export type UpdateTaskboardItemInputDto = {
  title?: string;
  description?: string;
  optionId?: string;
  assigneeIds?: string[];
  position?: number | null;
};

/* ----------------------------- Legacy FE-first types (optional) ----------------------------- */

export type TaskboardStatusOption = StatusPropertyOptionDto;

export type TaskboardColumn = {
  optionId: string;
  title: string;
  color?: string | null;
  position?: number | null;
};

export type TaskboardCard = {
  id: string; // documentId
  title: string;
  description?: string | null;
  columnOptionId: string | null; // status option id
  position?: number | null;
  assigneeIds: string[];
};

export type LegacyTaskboardDto = {
  id: string;
  projectId: string;
  name: string;

  statusProperty: {
    id: string;
    name: string;
    options: TaskboardStatusOption[];
  };

  columns: TaskboardColumn[];
  cards: TaskboardCard[];
};
