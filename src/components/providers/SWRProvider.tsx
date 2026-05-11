"use client";

import { SWRConfig } from "swr";
import { useEffect, useMemo } from "react";

const STORAGE_KEY = "mm-swr-cache-v1";
const MAX_KEYS = 250; // prevents unbounded growth
const TTL_MS = 1000 * 60 * 15; // 15 minutes

type Persisted = {
  t: number; // saved-at timestamp
  entries: [string, any][];
};

function loadCache(): Map<string, any> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Map();

    const parsed = JSON.parse(raw) as Persisted;
    if (!parsed?.t || !Array.isArray(parsed.entries)) return new Map();

    // TTL
    if (Date.now() - parsed.t > TTL_MS) return new Map();

    return new Map(parsed.entries);
  } catch {
    return new Map();
  }
}

function saveCache(cache: Map<string, any>) {
  try {
    const entries = Array.from(cache.entries());

    // keep last MAX_KEYS keys (simple eviction)
    const trimmed = entries.slice(-MAX_KEYS);

    const payload: Persisted = { t: Date.now(), entries: trimmed };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore quota / serialization errors
  }
}

function clearPersistedCache() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export default function SWRProvider({
  children,
  isAuthenticated,
}: {
  children: React.ReactNode;
  isAuthenticated: boolean;
}) {
  // If not authenticated: clear persisted cache (covers logout)
  useEffect(() => {
    if (!isAuthenticated) clearPersistedCache();
  }, [isAuthenticated]);

  const provider = useMemo(() => {
    // Only persist cache when authenticated.
    if (!isAuthenticated) {
      return () => new Map();
    }

    return () => {
      const cache = loadCache();

      const persistNow = () => saveCache(cache);

      // persist at good lifecycle moments
      window.addEventListener("beforeunload", persistNow);
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") persistNow();
      });

      return cache;
    };
  }, [isAuthenticated]);

  return <SWRConfig value={{ provider }}>{children}</SWRConfig>;
}
