"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import { GripVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { savePropertyOptions } from "@/modules/documents/client/docs.api";
import type { SavePropertyOptionsDto } from "@/modules/documents/dto/doc.dto";

type Option = SavePropertyOptionsDto["options"][number];

type Props = {
  projectId: string;
  docId: string;
  /** If not provided yet, we'll call ensurePropertyId() before first save */
  propertyId?: string;
  ensurePropertyId?: () => Promise<string>;
  disabled?: boolean;
  initialOptions?: Option[];
  onFirstPersist?: () => void;
  onSaved?: (opts: Option[]) => void;
};

const COLOR_CYCLE = [
  "mm-chip--gray",
  "mm-chip--pink",
  "mm-chip--red",
  "mm-chip--orange",
  "mm-chip--yellow",
  "mm-chip--green",
  "mm-chip--teal",
  "mm-chip--blue",
  "mm-chip--indigo",
  "mm-chip--violet",
  "mm-chip--purple",
] as const;

export default function PropertyOptionsField({
  projectId,
  docId,
  propertyId,
  initialOptions,
  ensurePropertyId,
  onFirstPersist,
  onSaved,
}: Props) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false); // do NOT disable input because of this
  const [opts, setOpts] = useState<Option[]>([]);
  const seeded = React.useRef(false);
  React.useEffect(() => {
    if (!seeded.current && initialOptions?.length) {
      setOpts(initialOptions);
      seeded.current = true;
    }
  }, [initialOptions]);
  const nextColor = useMemo(
    () => COLOR_CYCLE[opts.length % COLOR_CYCLE.length],
    [opts.length]
  );
  const alreadyTouchedRef = React.useRef(false);

  async function add(label: string) {
    const trimmed = label.trim();
    if (!trimmed || busy) return; // keep typing allowed; just ignore while saving
    if (opts.some((o) => o.value.toLowerCase() === trimmed.toLowerCase())) {
      setValue("");
      return;
    }
    const next: Option = {
      value: trimmed,
      color: nextColor,
      position: opts.length,
    };
    const all = [...opts, next];
    setOpts(all); // optimistic
    setValue("");
    await persist(all); // PUT full list; backend upserts & prunes non-sent
  }
  // remember a resolved id and/or the in-flight creation promise
  const ensuredIdRef = React.useRef<string | undefined>(propertyId);
  const ensureOnceRef = React.useRef<Promise<string> | null>(null);

  async function getPropertyId(): Promise<string | undefined> {
    if (ensuredIdRef.current) return ensuredIdRef.current;
    if (!ensurePropertyId) return undefined;

    // run ensurePropertyId only once; reuse the same promise while it is in flight
    if (!ensureOnceRef.current) {
      ensureOnceRef.current = ensurePropertyId().then((id) => {
        ensuredIdRef.current = id;
        return id;
      });
    }
    return ensureOnceRef.current;
  }
  async function persist(all: Option[]) {
    const pid = await getPropertyId();
    if (!pid) return;

    setBusy(true);
    try {
      const res = await savePropertyOptions(projectId, docId, pid, all);
      const normalized = (res.options ?? []).map((o, idx) => ({
        id: o.id,
        value: o.value,
        color: o.color ?? all[idx]?.color ?? null,
        position: o.position ?? idx,
      }));
      setOpts(normalized);

      if (!alreadyTouchedRef.current) {
        alreadyTouchedRef.current = true;
        onFirstPersist?.();
      }
      onSaved?.(normalized);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-1.5">
      <Label>Options</Label>

      <div className="rounded-md bg-muted/30 p-2">
        <Input
          placeholder="Type an option and press Enter"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void add(value);
            }
          }}
          aria-busy={busy}
        />

        {opts.length > 0 && (
          <div className="mt-2 max-h-44 overflow-auto rounded-md border">
            {opts.map((o) => (
              <div
                key={(o.id ?? o.value) + "_row"}
                className="mm-row flex items-center justify-between px-2 py-1.5 text-sm"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`mm-chip ${String(o.color ?? "mm-chip--gray")}`}
                  >
                    <GripVertical className="h-3 w-3 opacity-70" />
                    {o.value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {busy && <p className="text-xs text-muted-foreground">Saving…</p>}
    </div>
  );
}
