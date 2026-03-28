import { api } from "@/lib/api";
import type { Scene } from "@/types/story";

export const scenesApi = {
  list: (seriesId: string, bookId: string) =>
    api.get<Scene[]>(`/api/series/${seriesId}/books/${bookId}/scenes`),
  get: (seriesId: string, bookId: string, sceneId: string) =>
    api.get<Scene>(`/api/series/${seriesId}/books/${bookId}/scenes/${sceneId}`),
  create: (
    seriesId: string,
    bookId: string,
    data: { text?: string; chapterId?: string },
  ) => api.post<Scene>(`/api/series/${seriesId}/books/${bookId}/scenes`, data),
  update: (
    seriesId: string,
    bookId: string,
    sceneId: string,
    data: { text?: string; chapterId?: string },
  ) =>
    api.put<Scene>(
      `/api/series/${seriesId}/books/${bookId}/scenes/${sceneId}`,
      data,
    ),
  delete: (seriesId: string, bookId: string, sceneId: string) =>
    api.delete<void>(
      `/api/series/${seriesId}/books/${bookId}/scenes/${sceneId}`,
    ),
  reorder: (
    seriesId: string,
    bookId: string,
    items: Array<{ type: "chapter" | "scene"; id: string; rank: string }>,
  ) =>
    api.post<void>(`/api/series/${seriesId}/books/${bookId}/items/reorder`, {
      items,
    }),
};
