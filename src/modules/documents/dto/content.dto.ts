import { z } from "zod";
import type { JSONContent } from "@tiptap/core";
import { ALLOWED_MARK_TYPES } from "../domain/content.types";

const AllowedMark = z.enum(ALLOWED_MARK_TYPES);
const MarkSchema = z.object({
  type: AllowedMark,
  attrs: z
    .object({
      href: z.string().url().max(2048).optional(),
      target: z.enum(["_blank"]).optional(),
      rel: z.string().max(200).optional(),
    })
    .strip()
    .optional(),
});

type JC = JSONContent;
let NodeSchema: z.ZodType<JC>;
const NodeArray = () => z.array(z.lazy(() => NodeSchema)).optional();

const TextNode: z.ZodType<JC> = z.object({
  type: z.literal("text"),
  text: z.string().max(1_000_000).optional(),
  marks: z.array(MarkSchema).optional(),
});

const HeadingNode: z.ZodType<JC> = z.object({
  type: z.literal("heading"),
  attrs: z.object({ level: z.number().int().min(1).max(6) }).strict(),
  content: NodeArray(),
  marks: z.array(MarkSchema).optional(),
});
const GoogleDriveEmbedNode: z.ZodType<JSONContent> = z.object({
  type: z.literal("googleDriveEmbed"),
  attrs: z
    .object({
      embedId: z.string().uuid(), // the Embed.id from DB
      name: z.string().max(500).optional(), // display name
      previewLink: z.string().url(), // /file/d/<id>/preview
      webViewLink: z.string().url(), // /file/.../view
    })
    .strict(),
});

const ImageNode: z.ZodType<JC> = z.object({
  type: z.literal("image"),
  attrs: z
    .object({
      src: z.string().url().max(2048),
      alt: z.string().max(500).optional(),
      title: z.string().max(500).optional(),
    })
    .strict(),
});

const container = (t: string) =>
  z.object({
    type: z.literal(t),
    content: NodeArray(),
    marks: z.array(MarkSchema).optional(),
  }) as z.ZodType<JC>;
const ToggleSummaryNode: z.ZodType<JC> = z.object({
  type: z.literal("toggleSummary"),
  content: NodeArray(),
  marks: z.array(MarkSchema).optional(),
});

const ToggleBodyNode: z.ZodType<JC> = z.object({
  type: z.literal("toggleBody"),
  content: z.array(z.lazy(() => NodeSchema)).min(1),
});

const ToggleNode: z.ZodType<JC> = z.object({
  type: z.literal("toggle"),
  attrs: z.object({ open: z.boolean().optional() }).optional(),
  content: z
    .array(z.union([ToggleSummaryNode, ToggleBodyNode]))
    .min(2)
    .max(2),
});
const TableViewNode: z.ZodType<JC> = z.object({
  type: z.literal("tableView"),
  attrs: z
    .object({
      collectionId: z.string().uuid(),
    })
    .strict(),
});
const TimelineViewNode: z.ZodType<JSONContent> = z.object({
  type: z.literal("timelineView"),
  attrs: z
    .object({
      collectionId: z.string().uuid(),
      view: z.enum(["month", "week", "day", "hour"]).optional(),
      start: z.string().datetime().optional(),
    })
    .strict(),
});
const CalendarViewNode: z.ZodType<JSONContent> = z.object({
  type: z.literal("calendarView"),
  attrs: z
    .object({
      collectionId: z.string().uuid(),
      view: z.enum(["month"]).optional(),
      start: z.string().datetime().optional(),
    })
    .strict(),
});
NodeSchema = z.union([
  TextNode,
  HeadingNode,
  ImageNode,
  container("paragraph"),
  container("bulletList"),
  container("orderedList"),
  container("listItem"),
  container("taskList"),
  container("taskItem"),
  container("blockquote"),
  container("codeBlock"),
  ToggleNode,
  ToggleSummaryNode,
  ToggleBodyNode,
  TableViewNode,
  TimelineViewNode,
  CalendarViewNode,
  GoogleDriveEmbedNode,
  z.object({ type: z.literal("horizontalRule") }) as z.ZodType<JC>,
  z.object({ type: z.literal("hardBreak") }) as z.ZodType<JC>,
]);

export const DocContentSchema = z.object({
  type: z.literal("doc"),
  content: z.array(NodeSchema).optional(),
}) satisfies z.ZodType<JSONContent>;
export type DocContent = z.infer<typeof DocContentSchema>;

export const PatchDocContentRequestSchema = z.object({
  content: DocContentSchema,
  lastKnownUpdatedAt: z
    .string()
    .datetime()
    .transform((s) => new Date(s))
    .optional(),
});
export type PatchDocContentRequest = z.infer<
  typeof PatchDocContentRequestSchema
>;

export const GetDocContentResponseSchema = z.object({
  id: z.string().uuid(),
  content: DocContentSchema,
  updatedAt: z.string().datetime(),
});
export type GetDocContentResponse = z.infer<typeof GetDocContentResponseSchema>;
