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
      <Button variant="secondary" size="sm" onClick={() => setOpen((o) => !o)}>
        <Plus className="mr-2 h-4 w-4" />
        Add Property
      </Button>
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
