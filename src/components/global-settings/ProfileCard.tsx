"use client";
import * as React from "react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { userApi, type MeForSidebar } from "@/modules/user/client/user.api";

const ProfileSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(80),
  lastName: z.string().trim().min(1, "Last name is required").max(80),
  avatarUrl: z
    .string()
    .url("Must be a valid URL")
    .max(512)
    .or(z.literal(""))
    .optional(),
});
type ProfileFormValues = z.infer<typeof ProfileSchema>;
type ProfileCardProps = {
  me: MeForSidebar; // pass from page loader or fetch inside
  onUpdated?: (me: Partial<MeForSidebar>) => void; // optional callback if you want to notify others
};

export default function ProfileCard({ me, onUpdated }: ProfileCardProps) {
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: {
      firstName: me?.displayName?.split(" ")?.[0] ?? "",
      lastName: me?.displayName?.split(" ")?.slice(1).join(" ") ?? "",
      avatarUrl: me?.avatarUrl ?? "",
    },
    mode: "onBlur",
  });
  const avatarPreview = form.watch("avatarUrl") || me.avatarUrl || "";

  async function onSubmit(values: ProfileFormValues) {
    setSubmitting(true);
    try {
      const payload = {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        avatarUrl: values.avatarUrl?.trim?.() || null,
      };
      const updated = await userApi.updateProfile(payload);
      // optional: notify parent or broadcast
      onUpdated?.(updated);
    } catch (e: any) {
      console.error(e);
      alert(e?.message ?? "Failed to update profile");
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            {avatarPreview ? (
              <AvatarImage src={avatarPreview} alt={me.displayName} />
            ) : (
              <AvatarFallback
                className="font-semibold"
                title={me.displayName}
                aria-label={me.displayName}
              >
                {me.initials}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="text-sm text-muted-foreground">
            This is your public avatar. Paste an image URL for now. (Uploads can
            come later.)
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First name</FormLabel>
                    <FormControl>
                      <Input placeholder="Ada" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last name</FormLabel>
                    <FormControl>
                      <Input placeholder="Lovelace" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="avatarUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Avatar URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={submitting}
                className="mm-settings-cta"
              >
                {submitting ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
