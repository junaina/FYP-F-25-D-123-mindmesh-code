"use client";

import { useEffect, useState, FormEvent } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { projectsApi, type ProjectLite } from "@/modules/projects/client/project.api";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ProjectLite | null;
};

export default function InviteTeammateModal({ open, onOpenChange, project }: Props) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setEmail("");
      setErr(null);
      setSubmitting(false);
      setSuccess(null);
    }
  }, [open]);

  async function handleSubmit(e?: FormEvent) {
    e?.preventDefault();
    if (!project) return;
    if (!email.trim()) {
      setErr("Please enter an email address.");
      return;
    }
    setSubmitting(true);
    setErr(null);
    setSuccess(null);
    try {
      await projectsApi.invite(project.id, email.trim(), "MEMBER");
      setSuccess("Invite sent! The user will receive an email.");
    } catch (e: any) {
      setErr(e?.message ?? "Failed to send invite");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Invite teammate{project ? ` to “${project.name}”` : ""}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="person@example.com"
              disabled={submitting}
            />
            {err && <p className="text-xs text-red-500">{err}</p>}
            {success && <p className="text-xs text-green-600">{success}</p>}
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Close
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Sending…" : "Send invite"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
