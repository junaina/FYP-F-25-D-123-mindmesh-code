"use client";

import * as React from "react";
import {
  createPropertyBodyDto,
  type CreatePropertyBodyDto,
  type PropertyDefinitionDto,
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

export default function CreatePropertyForm({
  projectId,
  docId,
  onCancel,
  onCreated,
}: {
  projectId: string;
  docId: string;
  onCancel: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = React.useState("Select");
  const [loading, setLoading] = React.useState(false);
  const [created, setCreated] = React.useState<PropertyDefinitionDto | null>(
    null
  );
  const [touched, setTouched] = React.useState(false); // NEW
  const [showDiscard, setShowDiscard] = React.useState(false); // NEW
  const [saving, setSaving] = React.useState(false);

  const ensurePropertyId = React.useCallback(async (): Promise<string> => {
    if (created?.id) return created.id;
    const candidate = {
      name: name.trim(),
      type: "select",
    } as Partial<CreatePropertyBodyDto>;
    const payload = createPropertyBodyDto.parse(candidate);
    setLoading(true);
    try {
      const def = await createProperty(projectId, docId, payload);
      setCreated(def);
      return def.id;
    } finally {
      setLoading(false);
    }
  }, [created?.id, name, projectId, docId]);

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

  return (
    <>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="prop-name">Name</Label>
          <Input
            id="prop-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>

        <div className="space-y-1.5">
          <Label>Type</Label>
          <div className="w-full rounded-md border bg-muted/30 p-2 text-sm text-muted-foreground">
            Select
          </div>
          <p className="text-xs text-muted-foreground">
            More types coming soon.
          </p>
        </div>

        <PropertyOptionsField
          projectId={projectId}
          docId={docId}
          propertyId={created?.id}
          ensurePropertyId={ensurePropertyId}
          onFirstPersist={() => setTouched(true)} // mark dirty on first successful save
          onBusyChange={setSaving}
        />

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
            disabled={saving}
            aria-busy={saving}
          >
            {saving ? "Saving…" : "Done"}
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
