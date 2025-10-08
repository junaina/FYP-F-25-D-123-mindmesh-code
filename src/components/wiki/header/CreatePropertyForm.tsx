"use client";

import * as React from "react";
import {
  createPropertyBodyDto,
  type CreatePropertyBodyDto,
  type PropertyDefinitionDto,
  type PropertyValueDto,
} from "@/modules/documents/dto/doc.dto";
import {
  createProperty,
  deleteProperty,
} from "@/modules/documents/client/docs.api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import PropertyOptionsField from "./PropertyOptionsField";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { GripVertical } from "lucide-react";
import { formatISO } from "date-fns";

/** Keep this union in sync with your backend enum (PropertyType). */
type PropertyKind =
  | "text"
  | "number"
  | "date_time"
  | "email"
  | "url"
  | "checkbox"
  | "select"
  | "multi_select"
  | "status"
  | "person"
  | "file";

const OPTION_TYPES = new Set<PropertyKind>([
  "select",
  "multi_select",
  "status",
]);

const DEFAULT_LABEL: Record<PropertyKind, string> = {
  text: "Text",
  number: "Number",
  date_time: "Date Time",
  email: "Email",
  url: "Url",
  checkbox: "Checkbox",
  select: "Select",
  multi_select: "Multi Select",
  status: "Status",
  person: "Person",
  file: "File",
};
type Props = {
  projectId: string;
  docId: string;
  initialValue: PropertyKind;
  onCancel: () => void;
  onCreated: () => void;
};
type Option = {
  id?: string;
  value: string;
  color?: string | null;
  position?: number | null;
};

export default function CreatePropertyForm({
  projectId,
  docId,
  initialValue,
  onCancel,
  onCreated,
}: Props) {
  const [name, setName] = React.useState(DEFAULT_LABEL[initialValue]);
  const [nameEdited, setNameEdited] = React.useState(false);
  // If the user hasn't typed a custom name yet, keep the name in sync with type
  React.useEffect(() => {
    if (!nameEdited) setName(DEFAULT_LABEL[initialValue]);
  }, [initialValue, nameEdited]);
  const [loading, setLoading] = React.useState(false);
  const [created, setCreated] = React.useState<PropertyDefinitionDto | null>(
    null
  );
  const [busyCreate, setBusyCreate] = React.useState(false);
  const [optionsBusy, setOptionsBusy] = React.useState(false);
  const [touched, setTouched] = React.useState(false); // NEW
  const [showDiscard, setShowDiscard] = React.useState(false); // NEW
  const [saving, setSaving] = React.useState(false);
  // --- options coming from the editor (kept locally so the picker reflects changes)
  const [opts, setOpts] = React.useState<Option[]>([]);
  // --- value state (per type)
  const [valText, setValText] = React.useState("");
  const [valNumber, setValNumber] = React.useState<string>("");
  const [valBool, setValBool] = React.useState(false);
  const [valDate, setValDate] = React.useState<Date | undefined>(undefined);
  const [valSelect, setValSelect] = React.useState<string | null>(null);
  const [valMulti, setValMulti] = React.useState<string[]>([]);
  const ensurePropertyId = React.useCallback(async (): Promise<string> => {
    if (created?.id) return created.id;
    const candidate = {
      name: name.trim() || DEFAULT_LABEL[initialValue],
      type: initialValue,
    } as Partial<CreatePropertyBodyDto>;
    const payload = createPropertyBodyDto.parse(candidate);
    setLoading(true);
    setBusyCreate(true);
    try {
      const def = await createProperty(projectId, docId, payload);
      setCreated(def);
      if (!OPTION_TYPES.has(initialValue)) setTouched(true);
      return def.id;
    } finally {
      setLoading(false);
      setBusyCreate(false);
    }
  }, [created?.id, name, initialValue, projectId, docId]);

  async function handleCancel() {
    // If nothing was persisted this session, just close
    if (!created || !touched) {
      onCancel();
      return;
    }
    // Ask the user; if they confirm, delete the property we created/edited now
    setShowDiscard(true);
  }

  async function confirmDiscard() {
    if (created?.id) {
      try {
        await deleteProperty(projectId, docId, created.id); // backend GC handles options/def if unused
      } catch (e) {
        console.error("Delete property failed", e);
      }
    }
    setShowDiscard(false);
    onCancel();
  }
  // Build a PropertyValueDto from the local value state
  function buildValueDto(): PropertyValueDto | null {
    switch (initialValue) {
      case "text":
      case "email":
      case "url":
        return { type: initialValue, value: valText.trim() || null };
      case "number": {
        const n = valNumber === "" ? null : Number(valNumber);
        return {
          type: "number",
          value: Number.isFinite(n as number) ? n : null,
        };
      }
      case "checkbox":
        return { type: "checkbox", value: !!valBool };
      case "date_time":
        return {
          type: "date_time",
          value: valDate ? formatISO(valDate) : null,
        };
      case "select":
      case "status":
        return { type: initialValue, value: valSelect ?? null };
      case "multi_select":
        return { type: "multi_select", value: valMulti };
      default:
        return null; // person/file not implemented here
    }
  }

  const showOptions = OPTION_TYPES.has(initialValue);
  const doneDisabled =
    optionsBusy || busyCreate || (showOptions && !created?.id && optionsBusy);
  // --- Render helpers for the “Value” section -------------------------------

  function ValueField() {
    switch (initialValue) {
      case "text":
      case "email":
      case "url":
        return (
          <div className="space-y-1.5">
            <Label>Value</Label>
            <Input
              placeholder={`Enter ${DEFAULT_LABEL[initialValue]}`}
              value={valText}
              onChange={(e) => setValText(e.target.value)}
            />
          </div>
        );

      case "number":
        return (
          <div className="space-y-1.5">
            <Label>Value</Label>
            <Input
              type="number"
              inputMode="decimal"
              placeholder="Enter number"
              value={valNumber}
              onChange={(e) => setValNumber(e.target.value)}
            />
          </div>
        );

      case "checkbox":
        return (
          <div className="space-y-1.5">
            <Label>Value</Label>
            <div className="rounded-md border bg-muted/30 p-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={valBool}
                  onCheckedChange={(c) => setValBool(!!c)}
                />
                <span>Checked</span>
              </div>
            </div>
          </div>
        );

      case "date_time":
        return (
          <div className="space-y-1.5">
            <Label>Value</Label>
            <div className="rounded-md border bg-muted/30 p-2">
              <Calendar
                mode="single"
                selected={valDate}
                onSelect={(d) => setValDate(d ?? undefined)}
              />
            </div>
          </div>
        );

      case "select":
      case "status":
        return (
          <div className="space-y-1.5">
            <Label>Initial value</Label>
            <div className="rounded-md border bg-muted/30 p-2">
              {opts.length === 0 ? (
                <span className="text-sm text-muted-foreground">
                  No options yet
                </span>
              ) : (
                <Command>
                  <CommandList>
                    <CommandEmpty>No options</CommandEmpty>
                    <CommandGroup>
                      {opts.map((o) => (
                        <CommandItem
                          key={o.id ?? o.value}
                          value={o.value}
                          onSelect={() => setValSelect(o.id ?? null)}
                          className="cursor-pointer"
                        >
                          <span
                            className={`mm-chip ${String(
                              o.color ?? "mm-chip--gray"
                            )} ${
                              valSelect === o.id ? "ring-2 ring-primary" : ""
                            }`}
                          >
                            <GripVertical className="h-3 w-3 opacity-70" />
                            {o.value}
                          </span>
                        </CommandItem>
                      ))}
                      <CommandItem
                        value="__clear__"
                        onSelect={() => setValSelect(null)}
                      >
                        Clear
                      </CommandItem>
                    </CommandGroup>
                  </CommandList>
                </Command>
              )}
            </div>
          </div>
        );

      case "multi_select":
        return (
          <div className="space-y-1.5">
            <Label>Initial values</Label>
            <div className="rounded-md border bg-muted/30 p-2">
              {opts.length === 0 ? (
                <span className="text-sm text-muted-foreground">
                  No options yet
                </span>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {opts.map((o) => {
                    const active = valMulti.includes(o.id!);
                    return (
                      <span
                        key={o.id ?? o.value}
                        className={`mm-chip ${String(
                          o.color ?? "mm-chip--gray"
                        )} ${
                          active ? "ring-2 ring-primary" : ""
                        } cursor-pointer`}
                        onClick={() => {
                          setValMulti((prev) =>
                            prev.includes(o.id!)
                              ? prev.filter((x) => x !== o.id)
                              : [...prev, o.id!]
                          );
                        }}
                      >
                        <GripVertical className="h-3 w-3 opacity-70" />
                        {o.value}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null; // person/file later
    }
  }

  return (
    <>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="prop-name">Name</Label>
          <Input
            id="prop-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setNameEdited(true);
            }}
            autoFocus
          />
        </div>

        {/* Selected Type (read-only indicator) */}
        <div className="space-y-1.5">
          <Label>Type</Label>
          <div className="w-full rounded-md border bg-muted/30 p-2 text-sm">
            {DEFAULT_LABEL[initialValue]}
          </div>
        </div>

        {/* Options editor only for select-like types */}
        {showOptions && (
          <PropertyOptionsField
            projectId={projectId}
            docId={docId}
            propertyId={created?.id}
            ensurePropertyId={ensurePropertyId}
            onFirstPersist={() => setTouched(true)}
            // If your PropertyOptionsField supports this hook:
            onBusyChange={setOptionsBusy}
          />
        )}
        {/* Initial value */}
        <ValueField />

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={async () => {
              if (!created) await ensurePropertyId();
              onCreated();
            }}
            disabled={doneDisabled}
            aria-busy={busyCreate || optionsBusy}
          >
            {busyCreate || optionsBusy ? "Saving…" : "Done"}
          </Button>
        </div>
      </div>

      <AlertDialog open={showDiscard} onOpenChange={setShowDiscard}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard this property?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the property and its options from this doc.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDiscard}>
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
