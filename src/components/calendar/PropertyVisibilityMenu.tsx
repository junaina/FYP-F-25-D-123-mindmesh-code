"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";

export function PropertyVisibilityMenu({
  allProps,
  visible,
  onToggle,
}: {
  allProps: string[];
  visible: Set<string>;
  onToggle: (name: string, next: boolean) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          Properties
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>Show on cards</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {allProps.map((name) => (
          <DropdownMenuCheckboxItem
            key={name}
            checked={visible.has(name)}
            onCheckedChange={(v) => onToggle(name, Boolean(v))}
            className="capitalize"
          >
            {name}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
