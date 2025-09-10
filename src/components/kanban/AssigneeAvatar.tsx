"use client";

import * as React from "react";
import { Assignee } from "@/types/kanban";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export function AssigneeAvatar({
  user,
  className,
  title,
}: {
  user: Assignee;
  className?: string;
  title?: string;
}) {
  const initials = user.name
    .split(" ")
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  return (
    <Avatar
      className={cn("h-6 w-6 ring-2 ring-neutral-900", className)}
      title={title ?? user.name}
    >
      <AvatarImage src={user.avatarUrl} alt={user.name} />
      <AvatarFallback className="text-[10px]">{initials || "?"}</AvatarFallback>
    </Avatar>
  );
}
