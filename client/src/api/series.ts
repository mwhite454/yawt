import { api } from "@/lib/api";
import type { Series } from "@/types/story";

export const seriesApi = {
  list: () => api.get<Series[]>("/api/series"),
  get: (id: string) => api.get<Series>(`/api/series/${id}`),
  create: (data: Pick<Series, "title" | "description">) =>
    api.post<Series>("/api/series", data),
  update: (id: string, data: Partial<Pick<Series, "title" | "description">>) =>
    api.put<Series>(`/api/series/${id}`, data),
  delete: (id: string) => api.delete<void>(`/api/series/${id}`),
};
