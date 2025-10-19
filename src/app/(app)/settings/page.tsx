"use client";

import { useEffect, useState } from "react";
import SettingsLayout from "@/components/global-settings/SettingsLayout";
import ProfileCard from "@/components/global-settings/ProfileCard";
import { userApi, type MeForSidebar } from "@/modules/user/client/user.api";

export default function SettingsPage() {
  const [me, setMe] = useState<MeForSidebar | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    userApi
      .meForSidebar()
      .then(setMe)
      .catch((e) => setErr(e?.message ?? "Failed to load profile"));
  }, []);

  if (err) {
    return (
      <SettingsLayout active="profile">
        <div className="text-sm text-red-500">{err}</div>
      </SettingsLayout>
    );
  }

  if (!me) {
    return (
      <SettingsLayout active="profile">
        <div className="space-y-3">
          <div className="h-8 w-40 bg-muted animate-pulse rounded" />
          <div className="h-32 w-full bg-muted animate-pulse rounded" />
        </div>
      </SettingsLayout>
    );
  }

  return (
    <SettingsLayout active="profile">
      <ProfileCard
        me={me}
        onUpdated={(u) => setMe((prev) => ({ ...prev!, ...u }))}
      />
    </SettingsLayout>
  );
}
