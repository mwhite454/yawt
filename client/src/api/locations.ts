import { api } from "@/lib/api";
import type { Location } from "@/types/story";

export const locationsApi = {
  list: (seriesId: string) =>
    api.get<Location[]>(`/api/series/${seriesId}/locations`),
  get: (seriesId: string, locationId: string) =>
    api.get<Location>(`/api/series/${seriesId}/locations/${locationId}`),
  create: (
    seriesId: string,
    data: Pick<Location, "name"> &
      Partial<Pick<Location, "description" | "tags" | "coords" | "extra">>,
  ) => api.post<Location>(`/api/series/${seriesId}/locations`, data),
  update: (
    seriesId: string,
    locationId: string,
    data: Partial<
      Pick<Location, "name" | "description" | "tags" | "coords" | "extra">
    >,
  ) =>
    api.put<Location>(`/api/series/${seriesId}/locations/${locationId}`, data),
  delete: (seriesId: string, locationId: string) =>
    api.delete<void>(`/api/series/${seriesId}/locations/${locationId}`),
};
