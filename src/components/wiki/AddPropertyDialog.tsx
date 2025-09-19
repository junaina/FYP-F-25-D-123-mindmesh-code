// src/components/wiki/ui/AddPropertyDialog.tsx
"use client";

import { useMemo, useState } from "react";
import type {
  PropertyOption,
  PropertyType,
  PropertyDefinition,
} from "@/modules/documents/domain/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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

import type { PrimitiveInput } from "@/modules/documents/mappers/property.mapper";
import { patchDocHeader } from "@/modules/documents/client/docs.api"; // <-- make sure this exists

type Props = {
  /** Document to attach the new property to */
  docId: string;
  /** Update local UI state immediately */
  onCreate: (def: PropertyDefinition) => void;
  triggerClassName?: string;
};

const TYPES: { value: PropertyType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "select", label: "Select" },
  { value: "multi_select", label: "Multi-select" },
  { value: "status", label: "Status" },
  { value: "date_time", label: "Date & time" },
  { value: "email", label: "Email" },
  { value: "checkbox", label: "Checkbox" },
  { value: "person", label: "Person" },
  { value: "file", label: "File" },
];

export default function AddPropertyDialog({
  docId,
  onCreate,
  triggerClassName,
}: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<PropertyType>("text");
  const [optionsText, setOptionsText] = useState("");

  const needsOptions = useMemo(
    () => type === "select" || type === "multi_select" || type === "status",
    [type]
  );

  function makeOptions(src: string): PropertyOption[] {
    return src
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((v) => ({ id: crypto.randomUUID(), value: v, color: undefined }));
  }

  /** Initial primitive value per type (no `any`, fully typed) */
  function defaultPrimitive(t: PropertyType): PrimitiveInput {
    const byType: Record<PropertyType, PrimitiveInput> = {
      text: { type: "text", value: null },
      number: { type: "number", value: null },
      email: { type: "email", value: null },
      checkbox: { type: "checkbox", value: false },
      date_time: { type: "date_time", value: null },
      select: { type: "select", value: null },
      status: { type: "status", value: null },
      multi_select: { type: "multi_select", value: [] },
      person: { type: "person", value: [] },
      file: { type: "file", value: [] },
    };
    return byType[t];
  }

  async function submit() {
    const def: PropertyDefinition = {
      id: crypto.randomUUID(),
      name: (name || "Untitled").trim(),
      type,
      options: needsOptions ? makeOptions(optionsText) : undefined,
    };

    // 1) Update local UI immediately
    onCreate(def);

    // 2) Persist to server (create definition + link + initial value)
    await patchDocHeader(docId, {
      properties: {
        [def.name]: defaultPrimitive(def.type),
      },
    });

    // Reset & close
    setName("");
    setType("text");
    setOptionsText("");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className={`mm-btn-outline ${triggerClassName ?? ""}`}>
          + Add a Property
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Property</DialogTitle>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="prop-name">Name</Label>
            <Input
              id="prop-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Tags, Priority"
            />
          </div>

          <div className="grid gap-1.5">
            <Label>Type</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as PropertyType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pick a type" />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {needsOptions && (
            <div className="grid gap-1.5">
              <Label htmlFor="prop-options">Options (comma-separated)</Label>
              <Input
                id="prop-options"
                value={optionsText}
                onChange={(e) => setOptionsText(e.target.value)}
                placeholder="e.g. Todo, In Progress, Done"
              />
              <p className="text-xs text-muted-foreground">
                You can edit colors and order later.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit}>Create</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
