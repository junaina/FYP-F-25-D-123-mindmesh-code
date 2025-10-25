"use client";

import { useEffect, useState } from "react";
import ProfileCard from "@/components/global-settings/ProfileCard";
import { userApi, type MeForSidebar } from "@/modules/user/client/user.api";

export default function SettingsProfilePage() {
  const [me, setMe] = useState<MeForSidebar | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    userApi
      .meForSidebar()
      .then(setMe)
      .catch((e) => setErr(e?.message ?? "Failed to load profile"));
  }, []);

  if (err) return <div className="text-sm text-red-500">{err}</div>;

  // lightweight content skeleton (right pane only)
  if (!me) {
    return (
      <div className="space-y-3">
        <div className="h-8 w-40 bg-muted animate-pulse rounded" />
        <div className="h-32 w-full bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <ProfileCard
      me={me}
      onUpdated={(u) => setMe((prev) => ({ ...prev!, ...u }))}
    />
  );
}
