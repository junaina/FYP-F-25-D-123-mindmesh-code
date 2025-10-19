// src/app/(app)/settings/danger/page.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { userApi } from "@/modules/user/client/user.api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export default function DangerZonePage() {
  const [open, setOpen] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const router = useRouter();

  async function onConfirm() {
    try {
      setBusy(true);
      setErr(null);
      await userApi.deleteAccount();
      // Cookie cleared by backend → user is logged out
      router.replace("/login");
      router.refresh();
    } catch (e: any) {
      setErr(e?.message ?? "Failed to delete account");
    } finally {
      setBusy(false);
      setOpen(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-4 md:p-6">
        <h3 className="text-base font-semibold text-red-500">Danger Zone</h3>
        <p className="text-sm text-muted-foreground">
          Deleting your account permanently removes your data. This cannot be
          undone.
        </p>

        <div className="mt-4">
          <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="bg-red-600 hover:bg-red-700"
              >
                Delete my account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action permanently removes your account and data. If you
                  still own projects, you’ll need to delete or transfer them
                  first.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onConfirm}
                  disabled={busy}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {busy ? "Deleting…" : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {err ? <div className="mt-3 text-sm text-red-500">{err}</div> : null}
      </div>
    </div>
  );
}
