"use client";
import { useMemo, useState } from "react";
import type {
  PropertyOption,
  PropertyType,
  UIPropertyDefinition,
} from "@/types/wiki";
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

type Props = {
  onCreate: (def: UIPropertyDefinition) => void;
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
      .map((v) => ({ id: crypto.randomUUID(), value: v }));
  }
  function submit() {
    const def: UIPropertyDefinition = {
      id: crypto.randomUUID(),
      name: name.trim() || "Untitled",
      type,
      options: needsOptions ? makeOptions(optionsText) : undefined,
    };
    onCreate(def);
    // reset & close
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
