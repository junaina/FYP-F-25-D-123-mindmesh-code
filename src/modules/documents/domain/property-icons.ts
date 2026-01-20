import type { LucideIcon } from "lucide-react";
import {
  Tag, 
  Tags, 
  CheckCircle2,
  UserRound,
  Paperclip, 
  Link2, 
  Mail, 
  Hash,
  CalendarDays, 
  AlignLeft,
  Square,
} from "lucide-react";

export type PropertyType =
  | "text"
  | "number"
  | "email"
  | "url"
  | "checkbox"
  | "select"
  | "multi_select"
  | "status"
  | "person"
  | "file"
  | "date_time";

export const DefaultTypeIcon: Record<PropertyType, LucideIcon> = {
  text: AlignLeft,
  number: Hash,
  email: Mail,
  url: Link2,
  checkbox: Square,
  select: Tag,
  multi_select: Tags,
  status: CheckCircle2,
  person: UserRound,
  file: Paperclip,
  date_time: CalendarDays,
};
