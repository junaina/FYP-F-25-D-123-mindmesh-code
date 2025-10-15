"use client";
import { ColumnDef } from "@/modules/table/domain/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { PropertyType } from "@/modules/table/domain/types";
export default function ColumnMenu({
  column,
  onRename,
  onDelete,
  onEditOptions,
}: {
  column: ColumnDef;
  onRename: (p: {
    propertyId: string;
    name?: string;
    type?: PropertyType;
  }) => Promise<any>;
  onDelete: (p: { propertyId: string }) => Promise<any>;
  onEditOptions?: (column: ColumnDef) => void;
}) {
  const [name, setName] = useState(column.name);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          ⋮
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                console.log("UI: rename column →", {
                  propertyId: column.id,
                  name,
                });
                onRename({ propertyId: column.id, name });
              }
            }}
          />
        </div>
        {(column.type === "select" ||
          column.type === "status" ||
          column.type === "multi_select") && (
          <DropdownMenuItem onClick={() => onEditOptions?.(column)}>
            Edit options…
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-500"
          onClick={() => onDelete({ propertyId: column.id })}
        >
          Delete column
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
