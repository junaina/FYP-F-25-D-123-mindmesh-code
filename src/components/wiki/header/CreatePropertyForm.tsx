// src/app/components/wiki/header/CreatePropertyForm.tsx
"use client";

import * as React from "react";
import {
  createPropertyBodyDto,
  type CreatePropertyBodyDto,
} from "@/modules/documents/dto/doc.dto";
import { createProperty } from "@/modules/documents/client/docs.api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  projectId: string;
  docId: string;
  initialValue?: string;
  onCancel: () => void;
  onCreated: () => void; // parent can refresh header after create
};

export default function CreatePropertyForm({
  projectId,
  docId,
  onCancel,
  onCreated,
}: Props) {
  // UI state
  const [name, setName] = React.useState<string>("Select");
  // For this step we only support "select"; keeping state makes it easy to expand later.
  const [type, setType] = React.useState<"select">("select");
  const [loading, setLoading] = React.useState<boolean>(false);

  const canSubmit = !loading && name.trim().length > 0;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Build payload from UI state (options will come later)
    const candidate = {
      name: name.trim(),
      type, // "select"
      // options: [] // add when the Options editor is implemented
    } satisfies Partial<CreatePropertyBodyDto>;

    // Validate with your shared Zod DTO (single source of truth)
    const payload: CreatePropertyBodyDto =
      createPropertyBodyDto.parse(candidate);

    try {
      setLoading(true);
      await createProperty(projectId, docId, payload);
      onCreated();
    } catch (err) {
      // Replace with your toast system if you have one
      console.error("Failed to create property", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {/* Name */}
      <div className="space-y-1.5">
        <Label htmlFor="prop-name">Name</Label>
        <Input
          id="prop-name"
          placeholder="Property name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
      </div>

      {/* Type — locked to 'select' for now; UI present so we can expand later */}
      <div className="space-y-1.5">
        <Label>Type</Label>
        <Select
          value={type}
          onValueChange={(v) => setType(v as "select")}
          disabled
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="select">Select</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">More types coming soon.</p>
      </div>

      {/* Options placeholder (editor will be added in the next use case) */}
      <div className="space-y-1.5">
        <Label>Options</Label>
        <div className="rounded-md border p-3 text-sm text-muted-foreground bg-muted/30">
          Options editor coming soon…
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!canSubmit}>
          {loading ? "Creating…" : "Create"}
        </Button>
      </div>
    </form>
  );
}
