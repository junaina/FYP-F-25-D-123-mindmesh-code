"use client";

import { useQuery } from "@tanstack/react-query";
import type {
  InstancesResponse,
  PropertiesResponse,
  SettingsResponse,
} from "@/modules/calendar/dto/calendar.dto";

/** Get [from, to) ISO for the visible month using UTC boundaries */
export function monthRangeUTC(date: Date) {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  const from = new Date(Date.UTC(y, m, 1, 0, 0, 0));
  const to = new Date(Date.UTC(y, m + 1, 1, 0, 0, 0)); // exclusive
  return { from: from.toISOString(), to: to.toISOString() };
}

/** Reads all 3 read-path endpoints; safe if IDs are missing (queries disabled). */
export function useCalendarData(
  projectId: string | undefined,
  docId: string | undefined,
  collectionId: string | undefined,
  visibleMonthUTC: Date
) {
  const enabled = Boolean(projectId && docId && collectionId);
  const { from, to } = monthRangeUTC(visibleMonthUTC);

  const instances = useQuery({
    queryKey: ["cal", collectionId, from, to],
    enabled,
    queryFn: async (): Promise<InstancesResponse> => {
      const r = await fetch(
        `/api/projects/${projectId}/docs/${docId}/collections/${collectionId}/calendar?from=${from}&to=${to}`
      );
      if (!r.ok) throw new Error("calendar fetch failed");
      return (await r.json()) as InstancesResponse;
    },
  });

  const properties = useQuery({
    queryKey: ["cal-props", collectionId],
    enabled,
    queryFn: async (): Promise<PropertiesResponse> => {
      const r = await fetch(
        `/api/projects/${projectId}/docs/${docId}/collections/${collectionId}/calendar/properties`
      );
      if (!r.ok) throw new Error("properties fetch failed");
      return (await r.json()) as PropertiesResponse;
    },
  });

  const settings = useQuery({
    queryKey: ["cal-settings", collectionId],
    enabled,
    queryFn: async (): Promise<SettingsResponse> => {
      const r = await fetch(
        `/api/projects/${projectId}/docs/${docId}/collections/${collectionId}/calendar/settings`
      );
      if (!r.ok) throw new Error("settings fetch failed");
      return (await r.json()) as SettingsResponse;
    },
  });
  const isPendingAny =
    instances.isPending || properties.isPending || settings.isPending;

  const isFetchingAny =
    instances.isFetching || properties.isFetching || settings.isFetching;

  // show skeleton until *all* three have data at least once
  const haveAllData =
    Boolean(instances.data) &&
    Boolean(properties.data) &&
    Boolean(settings.data);

  const showSkeleton = !haveAllData || isPendingAny;

  return {
    instances,
    properties,
    settings,
    showSkeleton,
    isFetchingAny,
  };
}
