"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal } from "lucide-react";
import { addPropertyViaColumn, patchCollection, PropertyType } from "@/modules/table-view/client/table.api";
import { PropertyTypeMenu } from "./PropertyTypeMenu";

export function TableHeader({
  initialName,
  projectId,
  docId,
  collectionId,
  onPropertyAdded,
}: {
  initialName: string;
  projectId: string;
  docId: string;
  collectionId: string;
  onPropertyAdded: (def: { id: string; name: string; type: PropertyType }) => void;
}) {
  const [name, setName] = useState(initialName);
  const [editing, setEditing] = useState(false);

  async function saveName() {
    if (!name?.trim()) return;
    await patchCollection(projectId, collectionId, { name: name.trim() });
    setEditing(false);
  }

  async function handleAddProperty(sel: { label: string; type: PropertyType }) {
    const def = await addPropertyViaColumn(projectId, docId, collectionId, {
      name: sel.label,
      type: sel.type,
    });
    onPropertyAdded(def);
  }

  return (
    <div className="flex items-center justify-between gap-2 px-3 py-2 border-b">
      <div className="min-w-0">
        {editing ? (
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={saveName}
            onKeyDown={(e) => e.key === "Enter" && saveName()}
            className="h-8 font-medium"
            autoFocus
          />
        ) : (
          <button className="text-lg font-semibold truncate" onClick={() => setEditing(true)}>
            {name}
          </button>
        )}
      </div>

      <div className="flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Add column">
              <Plus className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="p-0">
            <PropertyTypeMenu onSelect={handleAddProperty} />
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Table actions">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
