// src/modules/documents/dto/content.dto.ts
import { z } from "zod";
import type { JSONContent } from "@tiptap/core";
import { ALLOWED_MARK_TYPES } from "../domain/content.types";

/* -------------------- marks -------------------- */
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

/* -------------------- nodes (recursive) -------------------- */
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
  z.object({ type: z.literal("horizontalRule") }) as z.ZodType<JC>,
  z.object({ type: z.literal("hardBreak") }) as z.ZodType<JC>,
]);

/* -------------------- top-level doc schema -------------------- */
export const DocContentSchema = z.object({
  type: z.literal("doc"),
  content: z.array(NodeSchema).optional(),
}) satisfies z.ZodType<JSONContent>;
export type DocContent = z.infer<typeof DocContentSchema>;

/* -------------------- PATCH body (request) -------------------- */
/** HTTP sends ISO string; transform → Date for service/DB */
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
// => { content: JSONContent; lastKnownUpdatedAt?: Date }

/* -------------------- GET response -------------------- */
export const GetDocContentResponseSchema = z.object({
  id: z.string().uuid(),
  content: DocContentSchema,
  updatedAt: z.string().datetime(), // keep ISO on the wire
});
export type GetDocContentResponse = z.infer<typeof GetDocContentResponseSchema>;
