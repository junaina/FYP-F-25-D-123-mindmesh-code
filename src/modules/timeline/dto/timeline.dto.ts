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
/**
 * Envelope for the GET response: { events: TimelineEvent[] }
 * (Helpful for validating in tests and keeping service/route aligned.)
 */

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
