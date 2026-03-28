import { api } from "@/lib/api";
import type { Timeline, Event } from "@/types/story";

export const timelinesApi = {
  list: (seriesId: string) =>
    api.get<Timeline[]>(`/api/series/${seriesId}/timelines`),
  get: (seriesId: string, timelineId: string) =>
    api.get<Timeline>(`/api/series/${seriesId}/timelines/${timelineId}`),
  create: (
    seriesId: string,
    data: Pick<Timeline, "title"> & Partial<Pick<Timeline, "description">>,
  ) => api.post<Timeline>(`/api/series/${seriesId}/timelines`, data),
  update: (
    seriesId: string,
    timelineId: string,
    data: Partial<Pick<Timeline, "title" | "description">>,
  ) =>
    api.put<Timeline>(`/api/series/${seriesId}/timelines/${timelineId}`, data),
  delete: (seriesId: string, timelineId: string) =>
    api.delete<void>(`/api/series/${seriesId}/timelines/${timelineId}`),

  listEvents: (seriesId: string, timelineId: string) =>
    api.get<Event[]>(`/api/series/${seriesId}/timelines/${timelineId}/events`),
};
