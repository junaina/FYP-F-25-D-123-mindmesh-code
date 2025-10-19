"use client";

import * as React from "react";
import { accountApi } from "@/modules/auth/client/account.api";
import ChangePasswordCard from "@/components/global-settings/ChangePasswordCard";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function AccountSettingsTab() {
  const [caps, setCaps] = React.useState<{
    hasPassword: boolean;
    providers: string[];
  } | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  const [busy, setBusy] = React.useState<"one" | "all" | null>(null);
  const [confirmAll, setConfirmAll] = React.useState(false);

  React.useEffect(() => {
    accountApi
      .security()
      .then(setCaps)
      .catch((e) => setErr(e?.message ?? "Failed to load"));
  }, []);

  async function doLogout() {
    try {
      setBusy("one");
      await accountApi.logout();
      // redirect to your login page (adjust path if different)
      window.location.href = "/login";
    } catch (e: any) {
      alert(e?.message ?? "Logout failed");
    } finally {
      setBusy(null);
    }
  }

  async function doLogoutAll() {
    try {
      setBusy("all");
      await accountApi.logoutAll();
      window.location.href = "/login";
    } catch (e: any) {
      alert(e?.message ?? "Logout all failed");
    } finally {
      setBusy(null);
      setConfirmAll(false);
    }
  }

  if (err) return <div className="text-sm text-red-500">{err}</div>;
  if (!caps)
    return <div className="h-24 w-full rounded-md border animate-pulse" />;

  return (
    <div className="space-y-6">
      {/* Password section */}
      {caps.hasPassword ? (
        <ChangePasswordCard />
      ) : (
        <div className="rounded-lg border p-4 md:p-6">
          <h3 className="text-base font-semibold">Password</h3>
          <p className="text-sm text-muted-foreground">
            You sign in with {caps.providers.join(", ")}. No local password is
            set.
          </p>
        </div>
      )}

      {/* Sessions / Logout section */}
      <div className="rounded-lg border p-4 md:p-6 space-y-3">
        <h3 className="text-base font-semibold">Sessions</h3>
        <div className="flex flex-wrap gap-2">
          <Button onClick={doLogout} disabled={busy === "one"} className="h-9">
            {busy === "one" ? "Signing out…" : "Log out"}
          </Button>

          <Button
            variant="destructive"
            onClick={() => setConfirmAll(true)}
            disabled={busy === "all"}
            className="h-9"
          >
            Log out of all devices
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          “Log out” ends your session on this browser only. “Log out of all
          devices” revokes every active session on your account.
        </p>
      </div>

      {/* Confirm dialog for logout-all */}
      <AlertDialog open={confirmAll} onOpenChange={setConfirmAll}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Log out everywhere?</AlertDialogTitle>
            <AlertDialogDescription>
              This will revoke all active sessions on every device. You’ll need
              to sign in again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy === "all"}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={doLogoutAll}
              className="bg-red-600 hover:bg-red-700"
              disabled={busy === "all"}
            >
              {busy === "all" ? "Logging out…" : "Log out of all devices"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
