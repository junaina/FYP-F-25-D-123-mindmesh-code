"use client";
import { useState } from "react";
import { Button } from "../../ui/button";
import { Plus } from "lucide-react";
import AddPropertyPopover from "@/components/wiki/header/AddPropertyPopover";
type Props = {
  projectId: string;
  docId: string;
  onCreated?: () => void;
};
export default function AddPropertyButton({
  projectId,
  docId,
  onCreated,
}: Props) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        className="mm-ghost-cta"
        aria-haspopup="dialog"
        aria-expanded={open}
        data-state={open ? "open" : "closed"}
        onClick={() => setOpen((o) => !o)}
      >
        <Plus className="mm-ghost-cta__icon" />
        <span>Add a property</span>
      </button>
      <AddPropertyPopover
        open={open}
        onOpenChange={setOpen}
        projectId={projectId}
        docId={docId}
        onCreated={() => {
          setOpen(false);
          onCreated?.();
        }}
      />
    </div>
  );
}
