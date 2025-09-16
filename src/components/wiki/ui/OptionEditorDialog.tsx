// src/components/wiki/ui/OptionEditorDialog.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { PropertyOption } from "@/modules/documents/domain/types";

export default function OptionEditorDialog({
  initial,
  onSave,
}: {
  initial: PropertyOption[];
  onSave: (opts: PropertyOption[]) => Promise<void> | void;
}) {
  const [open, setOpen] = useState(false);
  const [opts, setOpts] = useState<PropertyOption[]>(initial);

  const add = () =>
    setOpts((o) => [
      ...o,
      {
        id: crypto.randomUUID(),
        value: "New option",
        color: null,
        position: o.length,
      },
    ]);

  const remove = (id: string) => setOpts((o) => o.filter((x) => x.id !== id));
  const move = (i: number, dir: -1 | 1) =>
    setOpts((o) => {
      const arr = [...o];
      const j = i + dir;
      if (j < 0 || j >= arr.length) return o;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return arr.map((x, idx) => ({ ...x, position: idx }));
    });

  const save = async () => {
    await onSave(opts.map((x, i) => ({ ...x, position: i })));
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Edit options
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit options</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {opts.map((o, i) => (
            <div key={o.id} className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => move(i, -1)}>
                ↑
              </Button>
              <Button variant="ghost" size="icon" onClick={() => move(i, +1)}>
                ↓
              </Button>
              <Input
                value={o.value}
                onChange={(e) =>
                  setOpts((a) =>
                    a.map((x) =>
                      x.id === o.id ? { ...x, value: e.target.value } : x
                    )
                  )
                }
                className="flex-1"
              />
              <input
                type="color"
                value={o.color ?? "#666666"}
                onChange={(e) =>
                  setOpts((a) =>
                    a.map((x) =>
                      x.id === o.id ? { ...x, color: e.target.value } : x
                    )
                  )
                }
                className="h-9 w-12 rounded border"
              />
              <Button
                variant="destructive"
                size="sm"
                onClick={() => remove(o.id)}
              >
                Delete
              </Button>
            </div>
          ))}
          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={add}>
              Add option
            </Button>
            <Button onClick={save}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
