"use client";

import * as React from "react";
import {
  preferencesApi,
  type ThemeChoice,
} from "@/modules/prefs/client/preferences.api";
// If you already re-export useTheme from your app's provider, import from there:
// import { useTheme } from "@/components/theme-provider";
import { useTheme } from "next-themes";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";

export default function PreferencesThemeOnly() {
  const { setTheme } = useTheme(); // Applies theme immediately in the UI
  const [theme, setLocalTheme] = React.useState<ThemeChoice | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    preferencesApi
      .get()
      .then((p) => setLocalTheme(p.theme))
      .catch((e) => setErr(e?.message ?? "Failed to load preferences"));
  }, []);

  async function applyTheme(next: ThemeChoice) {
    if (theme === next) return;
    // optimistic UI
    setLocalTheme(next);
    setTheme(next);
    try {
      setSaving(true);
      await preferencesApi.setTheme(next);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to save theme");
      // best-effort: revert to previous
      const prev = theme ?? "system";
      setLocalTheme(prev);
      setTheme(prev);
    } finally {
      setSaving(false);
    }
  }

  if (err) return <div className="text-sm text-red-500">{err}</div>;

  // skeleton
  if (!theme)
    return <div className="h-24 w-full rounded-md border animate-pulse" />;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-4 md:p-6">
        <h3 className="text-base font-semibold">Theme</h3>
        <p className="text-sm text-muted-foreground mb-3">
          Choose how Mindmesh looks. “System” follows your OS setting.
        </p>

        <RadioGroup
          value={theme}
          onValueChange={(v) => applyTheme(v as ThemeChoice)}
          className="grid grid-cols-1 sm:grid-cols-3 gap-2"
        >
          <ThemeOption value="system" label="System" desc="Follow device" />
          <ThemeOption value="light" label="Light" desc="Bright" />
          <ThemeOption value="dark" label="Dark" desc="Dim" />
        </RadioGroup>

        <div className="mt-4">
          <Button
            variant="outline"
            className="mm-btn-outline"
            disabled={saving || theme === "system"}
            onClick={() => applyTheme("system")}
          >
            Reset to system
          </Button>
        </div>

        {saving ? (
          <div className="mt-2 text-xs text-muted-foreground">Saving…</div>
        ) : null}
      </div>
    </div>
  );
}

function ThemeOption({
  value,
  label,
  desc,
}: {
  value: ThemeChoice;
  label: string;
  desc: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[var(--radius)] border px-3 py-2">
      <RadioGroupItem id={`theme-${value}`} value={value} />
      <Label
        htmlFor={`theme-${value}`}
        className="cursor-pointer flex flex-col leading-tight"
      >
        <span className="font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">{desc}</span>
      </Label>
    </div>
  );
}
