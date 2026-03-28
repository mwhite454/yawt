import { api } from "@/lib/api";
import type { Chapter } from "@/types/story";

export const chaptersApi = {
  list: (seriesId: string, bookId: string) =>
    api.get<Chapter[]>(`/api/series/${seriesId}/books/${bookId}/chapters`),
  get: (seriesId: string, bookId: string, chapterId: string) =>
    api.get<Chapter>(
      `/api/series/${seriesId}/books/${bookId}/chapters/${chapterId}`,
    ),
  create: (
    seriesId: string,
    bookId: string,
    data: Pick<Chapter, "title"> & Partial<Pick<Chapter, "description">>,
  ) =>
    api.post<Chapter>(`/api/series/${seriesId}/books/${bookId}/chapters`, data),
  update: (
    seriesId: string,
    bookId: string,
    chapterId: string,
    data: Partial<Pick<Chapter, "title" | "description">>,
  ) =>
    api.put<Chapter>(
      `/api/series/${seriesId}/books/${bookId}/chapters/${chapterId}`,
      data,
    ),
  delete: (seriesId: string, bookId: string, chapterId: string) =>
    api.delete<void>(
      `/api/series/${seriesId}/books/${bookId}/chapters/${chapterId}`,
    ),
};
