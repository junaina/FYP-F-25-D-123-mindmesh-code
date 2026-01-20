"use client";

import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { accountApi } from "@/modules/auth/client/account.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast"; // shadcn toast hook if you have it

const Schema = z
  .object({
    currentPassword: z.string().min(8, "Must be at least 8 characters"),
    newPassword: z.string().min(8, "Must be at least 8 characters"),
  })
  .refine((v) => v.currentPassword !== v.newPassword, {
    message: "New password must be different",
    path: ["newPassword"],
  });

type FormValues = z.infer<typeof Schema>;

export default function ChangePasswordCard() {
  const { toast } = useToast?.() ?? { toast: (x: any) => alert(x?.title ?? x) };
  const [showCurrent, setShowCurrent] = React.useState(false);
  const [showNew, setShowNew] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: { currentPassword: "", newPassword: "" },
  });

  const pending = form.formState.isSubmitting;

  async function onSubmit(values: FormValues) {
    try {
      await accountApi.changePassword(
        values.currentPassword,
        values.newPassword
      );
      form.reset();
      toast({ title: "Password updated" });
    } catch (e: any) {
      toast({ title: e?.message ?? "Failed to change password" });
    }
  }

  return (
    <div className="rounded-lg border p-4 md:p-6">
      <div className="mb-4">
        <h3 className="text-base font-semibold">Change password</h3>
        <p className="text-sm text-muted-foreground">
          Update the password you use to sign in.
        </p>
      </div>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4 max-w-md"
      >
        {/* Current */}
        <div className="space-y-2">
          <Label htmlFor="currentPassword">Current password</Label>
          <div className="relative">
            <Input
              id="currentPassword"
              type={showCurrent ? "text" : "password"}
              {...form.register("currentPassword")}
              disabled={pending}
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
              onClick={() => setShowCurrent((s) => !s)}
              aria-label={showCurrent ? "Hide password" : "Show password"}
            >
              {showCurrent ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {form.formState.errors.currentPassword && (
            <p className="text-sm text-destructive">
              {form.formState.errors.currentPassword.message}
            </p>
          )}
        </div>

        {/* New */}
        <div className="space-y-2">
          <Label htmlFor="newPassword">New password</Label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showNew ? "text" : "password"}
              {...form.register("newPassword")}
              disabled={pending}
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
              onClick={() => setShowNew((s) => !s)}
              aria-label={showNew ? "Hide password" : "Show password"}
            >
              {showNew ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {form.formState.errors.newPassword && (
            <p className="text-sm text-destructive">
              {form.formState.errors.newPassword.message}
            </p>
          )}
        </div>

        <div className="pt-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save password"}
          </Button>
        </div>
      </form>
    </div>
  );
}
