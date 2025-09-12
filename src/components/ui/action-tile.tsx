"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Plus,
  FilePlus2,
  MessageSquarePlus,
  Video,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  "file-plus-2": FilePlus2,
  "message-square-plus": MessageSquarePlus,
  video: Video,
  plus: Plus,
};

type ActionTileProps = {
  label: string;
  href?: string;
  iconName?: keyof typeof ICONS; // <- serializable
  className?: string;
};

export default function ActionTile({
  label,
  href,
  iconName = "plus",
  className,
}: ActionTileProps) {
  const Icon = ICONS[iconName] ?? Plus;

  const content = (
    <Card
      className={cn(
        "flex items-center justify-center gap-2 px-4 py-6 border-2 border-pink-500 rounded-xl hover:bg-pink-500/10 transition",
        className
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="text-sm font-medium">{label}</span>
    </Card>
  );

  return href ? <Link href={href} className="block">{content}</Link> : content;
}
