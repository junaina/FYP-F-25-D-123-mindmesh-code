"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export type AddItemPayload = {
  title: string;
};

export function AddItemDialog({
  open,
  onOpenChange,
  date,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  date: Date | null;
  onAdd: (p: AddItemPayload) => void;
}) {
  const [title, setTitle] = React.useState("");

  const handleSubmit = () => {
    if (title.trim()) {
      onAdd({ title });
      setTitle("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Add Item {date ? `— ${date.toDateString()}` : ""}
          </DialogTitle>
        </DialogHeader>
        <div className="py-2">
          <Input
            placeholder="Event title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Add</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
