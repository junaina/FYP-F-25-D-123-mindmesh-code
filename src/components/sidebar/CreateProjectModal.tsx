"use client";

import { useState, useEffect, FormEvent } from "react";
import {
  projectsApi,
  type ProjectLite,
} from "@/modules/projects/client/project.api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: (project: ProjectLite) => void;
};

export default function CreateProjectModal({
  open,
  onOpenChange,
  onCreated,
}: Props) {
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setName("");
      setErr(null);
      setSubmitting(false);
    }
  }, [open]);

  async function handleSubmit(e?: FormEvent) {
    e?.preventDefault();
    if (!name.trim()) return setErr("Please enter a name.");
    setSubmitting(true);
    setErr(null);
    try {
      const p = await projectsApi.create(name.trim());
      onCreated(p); // add to sidebar list
      onOpenChange(false); // close modal
    } catch (e: any) {
      setErr(e?.message ?? "Failed to create project");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create project</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Project name</label>
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Project Alpha"
              disabled={submitting}
            />
            {err && <p className="text-xs text-red-500">{err}</p>}
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
