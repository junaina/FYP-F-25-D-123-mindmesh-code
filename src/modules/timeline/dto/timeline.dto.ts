import { z } from "zod";

//path params for GET /api/projects/:projectId/docs/:docId/collections/:collectionId/timeline/events
export const TimelineParamsDto = z.object({
  projectId: z.string().uuid(),
  docId: z.string().uuid(),
  collectionId: z.string().uuid(),
});
export type TimelineParams = z.infer<typeof TimelineParamsDto>;
export const TimelineEventPropertyDto = z.object({
  id: z.string().uuid(),
  name: z.string(),
  type: z.string(),
  value: z.unknown().nullable(),
});
export type TimelineEventProperty = z.infer<typeof TimelineEventPropertyDto>;

export const TimelineEventDto = z.object({
  id: z.string().uuid(),
  title: z.string(),
  start: z.string().datetime().nullable(),
  end: z.string().datetime().nullable(),
  addedById: z.string().nullable().optional(),
  properties: z.array(TimelineEventPropertyDto),
});
export type TimelineEvent = z.infer<typeof TimelineEventDto>;

//create a timeline event
export const CreateTimelineEventDto = z
  .object({
    title: z.string().min(1),
    start: z.string().datetime(),
    end: z.string().datetime(),
    properties: z
      .array(
        z.object({
          name: z.string(),
          type: z.string(),
          value: z.unknown().optional(),
        })
      )
      .optional(),
  })
  .refine((d) => new Date(d.start) <= new Date(d.end), {
    message: "start must be <= end",
  });

// Body for creating a timeline collection (name optional)
export const CreateTimelineDto = z.object({
  name: z.string().min(1).max(120).optional().default("Timeline"),
});
export type CreateTimelineInput = z.infer<typeof CreateTimelineDto>;

// Response
export const TimelineCollectionDto = z.object({
  id: z.string().uuid(),
  documentId: z.string().uuid(),
  name: z.string(),
  type: z.literal("timeline"),
  createdById: z.string(), // relax if your dev seed isn't a UUID
});
// Params schema for routes with collectionId
export const TimelineWithCollectionParamsDto = z.object({
  projectId: z.string().uuid(),
  docId: z.string().uuid(),
  collectionId: z.string().uuid(),
});
export type TimelineWithCollectionParams = z.infer<
  typeof TimelineWithCollectionParamsDto
>;

// PATCH body schema for renaming a timeline
export const PatchTimelineNameDto = z.object({
  name: z.string().trim().min(1).max(120),
});

//get and put property visibility on timeline
/** Property definition (the union list the UI can choose from) */
export const TimelinePropertyDefDto = z.object({
  id: z.string().uuid(),
  name: z.string(),
  kind: z.string(), // 'text' | 'number' | 'date_time' | 'select' | 'multi_select' | ...
});
export type TimelinePropertyDef = z.infer<typeof TimelinePropertyDefDto>;

export const PropertyOptionDto = z.object({
  id: z.string().uuid(),
  name: z.string(), // we’ll map Prisma's `value` -> `name`
});
export type PropertyOption = z.infer<typeof PropertyOptionDto>;

/** GET response: union of props + currently visible propertyIds */
export const GetTimelinePropertiesResponseDto = z.object({
  properties: z.array(TimelinePropertyDefDto),
  visiblePropertyIds: z.array(z.string().uuid()),
  // NEW (optional for back-compat):
  optionsByPropertyId: z
    .record(z.string().uuid(), z.array(PropertyOptionDto))
    .optional(),
});
export type GetTimelinePropertiesResponse = z.infer<
  typeof GetTimelinePropertiesResponseDto
>;

/** PUT body: replace visible set (idempotent) */
export const PutTimelinePropertiesBodyDto = z.object({
  visiblePropertyIds: z.array(z.string().uuid()).max(200), // safety cap
});
export type PutTimelinePropertiesBody = z.infer<
  typeof PutTimelinePropertiesBodyDto
>;

//params or routes that address a specific document/event in a timeline
export const TimelineEventParamsDto = z.object({
  projectId: z.string().uuid(),
  docId: z.string().uuid(),
  collectionId: z.string().uuid(),
  documentId: z.string().uuid(),
});
export type TimelineEventParams = z.infer<typeof TimelineEventParamsDto>;

//moving ad resizing events
/** MOVE: set a new start; keep duration. */
export const MoveTimelineEventBodyDto = z.object({
  to: z.string().datetime(), // ISO string for new start
});
export type MoveTimelineEventBody = z.infer<typeof MoveTimelineEventBodyDto>;

/** RESIZE: drag start or end to a new instant. */
export const ResizeTimelineEventBodyDto = z.object({
  edge: z.enum(["start", "end"]),
  to: z.string().datetime(), // ISO string for new edge value
});
export type ResizeTimelineEventBody = z.infer<
  typeof ResizeTimelineEventBodyDto
>;

/** Simple success response */
export const OkResponseDto = z.object({ success: z.literal(true) });
export type OkResponse = z.infer<typeof OkResponseDto>;

//reposne for deleting events
export const DeleteTimelineEventResponseDto = z.object({
  success: z.literal(true),
});
export type DeleteTimelineEventResponse = z.infer<
  typeof DeleteTimelineEventResponseDto
>;

export type PatchTimelineNameInput = z.infer<typeof PatchTimelineNameDto>;
export type TimelineCollection = z.infer<typeof TimelineCollectionDto>;
//list response
export const ListTimelineCollectionsResponseDto = z.object({
  collections: z.array(TimelineCollectionDto),
});
export type ListTimelineCollectionsResponse = z.infer<
  typeof ListTimelineCollectionsResponseDto
>;
export type CreateTimelineEvent = z.infer<typeof CreateTimelineEventDto>;
export const ListTimelineEventsResponseDto = z.object({
  events: z.array(TimelineEventDto),
});
export type ListTimelineEventsResponse = z.infer<
  typeof ListTimelineEventsResponseDto
>;
export type CreateTimelineEventInput = z.infer<typeof CreateTimelineEventDto>;
