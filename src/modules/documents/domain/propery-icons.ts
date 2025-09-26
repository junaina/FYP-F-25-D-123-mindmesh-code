//property icon registry
import type { LucideIcon } from "lucide-react";
import {
  Tag, // select
  Tags, // multi_select
  CheckCircle2, // status
  UserRound, // person
  Paperclip, // file
  Link2, // url
  Mail, // email
  Hash, // number
  CalendarDays, // date_time
  AlignLeft, // text
  Square, // checkbox (unchecked)
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
