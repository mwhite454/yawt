import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { timelinesApi } from "@/api/timelines";
import { eventsApi } from "@/api/events";
import type { Timeline, Event } from "@/types/story";

export const timelinesKeys = {
  all: (seriesId: string) => ["series", seriesId, "timelines"] as const,
  events: (seriesId: string, timelineId: string) =>
    ["series", seriesId, "timelines", timelineId, "events"] as const,
};

export function useTimelinesQuery(seriesId: string) {
  return useQuery({
    queryKey: timelinesKeys.all(seriesId),
    queryFn: () => timelinesApi.list(seriesId),
    enabled: !!seriesId,
  });
}

export function useTimelineEventsQuery(seriesId: string, timelineId: string) {
  return useQuery({
    queryKey: timelinesKeys.events(seriesId, timelineId),
    queryFn: () => timelinesApi.listEvents(seriesId, timelineId),
    enabled: !!(seriesId && timelineId),
  });
}

export function useCreateTimelineMutation(seriesId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      data: Pick<Timeline, "title"> & Partial<Pick<Timeline, "description">>,
    ) => timelinesApi.create(seriesId, data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: timelinesKeys.all(seriesId) }),
  });
}

export function useUpdateTimelineMutation(
  seriesId: string,
  timelineId: string,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Pick<Timeline, "title" | "description">>) =>
      timelinesApi.update(seriesId, timelineId, data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: timelinesKeys.all(seriesId) }),
  });
}

export function useDeleteTimelineMutation(seriesId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (timelineId: string) =>
      timelinesApi.delete(seriesId, timelineId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: timelinesKeys.all(seriesId) }),
  });
}

export function useCreateEventMutation(seriesId: string, timelineId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      data: Pick<Event, "title"> &
        Partial<
          Pick<
            Event,
            | "description"
            | "startDate"
            | "endDate"
            | "locationId"
            | "characterIds"
            | "sceneIds"
            | "tags"
          >
        >,
    ) => eventsApi.create(seriesId, timelineId, data),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: timelinesKeys.events(seriesId, timelineId),
      }),
  });
}

export function useUpdateEventMutation(seriesId: string, timelineId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      data,
    }: {
      eventId: string;
      data: Partial<
        Pick<
          Event,
          | "title"
          | "description"
          | "startDate"
          | "endDate"
          | "locationId"
          | "characterIds"
          | "sceneIds"
          | "tags"
        >
      >;
    }) => eventsApi.update(seriesId, eventId, data),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: timelinesKeys.events(seriesId, timelineId),
      }),
  });
}

export function useDeleteEventMutation(seriesId: string, timelineId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (eventId: string) => eventsApi.delete(seriesId, eventId),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: timelinesKeys.events(seriesId, timelineId),
      }),
  });
}
