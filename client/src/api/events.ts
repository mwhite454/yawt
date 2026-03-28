import { api } from "@/lib/api";
import type { Event } from "@/types/story";

export const eventsApi = {
  get: (seriesId: string, eventId: string) =>
    api.get<Event>(`/api/series/${seriesId}/events/${eventId}`),
  create: (
    seriesId: string,
    timelineId: string,
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
  ) =>
    api.post<Event>(
      `/api/series/${seriesId}/timelines/${timelineId}/events`,
      data,
    ),
  update: (
    seriesId: string,
    eventId: string,
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
    >,
  ) => api.put<Event>(`/api/series/${seriesId}/events/${eventId}`, data),
  delete: (seriesId: string, eventId: string) =>
    api.delete<void>(`/api/series/${seriesId}/events/${eventId}`),
};
