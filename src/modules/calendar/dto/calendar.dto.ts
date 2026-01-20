import { z } from "zod";

import {
  PropertyTypeDto, 
  PropertyValueDto, 
} from "@/modules/documents/dto/doc.dto";


export const DateLike = z
  .string()
  .trim()
  .refine(
    (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) || !Number.isNaN(Date.parse(s)),
    "from/to must be YYYY-MM-DD or ISO"
  )
  .transform((s) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      return new Date(`${s}T00:00:00.000Z`).toISOString();
    }
    return new Date(s).toISOString();
  });

export const ListInstancesQueryDto = z
  .object({
    from: DateLike,
    to: DateLike,
  })
  .refine((q) => new Date(q.from).getTime() <= new Date(q.to).getTime(), {
    message: "`from` must be ≤ `to`",
  })
  .refine(
    (q) =>
      (new Date(q.to).getTime() - new Date(q.from).getTime()) /
        (1000 * 60 * 60 * 24) <=
      120,
    { message: "range too large; please query ≤ 120 days" }
  );
export type ListInstancesQuery = z.infer<typeof ListInstancesQueryDto>;

export const CalendarInstanceDto = z.object({
  instanceId: z.string(), 
  documentId: z.string().uuid(),
  title: z.string(),
  start: z.string().datetime(), 
  end: z.string().datetime(), 
  isRange: z.boolean(),

  
  properties: z.record(z.string().uuid(), PropertyValueDto),

  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});
export type CalendarInstance = z.infer<typeof CalendarInstanceDto>;

export const InstancesResponseDto = z.object({
  instances: z.array(CalendarInstanceDto),
});
export type InstancesResponse = z.infer<typeof InstancesResponseDto>;

export const CalendarPropertyDto = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  kind: PropertyTypeDto,
  options: z
    .array(
      z.object({
        id: z.string().uuid(),
        value: z.string(),
        color: z.string().nullable(),
      })
    )
    .optional(),
});
export type CalendarProperty = z.infer<typeof CalendarPropertyDto>;

export const PropertiesResponseDto = z.object({
  properties: z.array(CalendarPropertyDto),
});
export type PropertiesResponse = z.infer<typeof PropertiesResponseDto>;

export const SettingsResponseDto = z.object({
  visiblePropertyIds: z.array(z.string().uuid()),
});
export type SettingsResponse = z.infer<typeof SettingsResponseDto>;

export const PutSettingsBodyDto = z.object({
  visiblePropertyIds: z.array(z.string().uuid()).max(200).default([]),
});
export type PutSettingsBody = z.infer<typeof PutSettingsBodyDto>;

export const CreateEventBodyDto = z
  .object({
    title: z.string().trim().min(1).max(255).default("New event"),
    mode: z.enum(["single", "range"]).default("single"),
    date: DateLike.optional(),
    start: DateLike.optional(),
    end: DateLike.optional(),
    inheritAllCalendarProps: z.boolean().default(true),
  })
  .superRefine((v, ctx) => {
    if (v.mode === "single") {
      if (!v.date)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "date required",
          path: ["date"],
        });
    } else {
      if (!v.start)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "start required",
          path: ["start"],
        });
      if (!v.end)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "end required",
          path: ["end"],
        });
      if (v.start && v.end && new Date(v.start) > new Date(v.end)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "start must be ≤ end",
          path: ["start"],
        });
      }
    }
  });
export type CreateEventBody = z.infer<typeof CreateEventBodyDto>;

export const PatchEventBodyDto = z.discriminatedUnion("op", [
  z.object({
    op: z.literal("rename"),
    title: z.string().trim().min(1).max(255),
  }),
  z.object({ op: z.literal("move"), deltaDays: z.number().int() }),
  z.object({
    op: z.literal("resize"),
    edge: z.enum(["start", "end"]),
    to: DateLike,
  }),
]);
export type PatchEventBody = z.infer<typeof PatchEventBodyDto>;
