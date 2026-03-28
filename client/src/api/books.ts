import { api } from "@/lib/api";
import type { Book } from "@/types/story";

export const booksApi = {
  list: (seriesId: string) => api.get<Book[]>(`/api/series/${seriesId}/books`),
  get: (seriesId: string, bookId: string) =>
    api.get<Book>(`/api/series/${seriesId}/books/${bookId}`),
  create: (
    seriesId: string,
    data: Pick<Book, "title"> &
      Partial<Pick<Book, "author" | "publishDate" | "isbn">>,
  ) => api.post<Book>(`/api/series/${seriesId}/books`, data),
  update: (
    seriesId: string,
    bookId: string,
    data: Partial<Pick<Book, "title" | "author" | "publishDate" | "isbn">>,
  ) => api.put<Book>(`/api/series/${seriesId}/books/${bookId}`, data),
  delete: (seriesId: string, bookId: string) =>
    api.delete<void>(`/api/series/${seriesId}/books/${bookId}`),
};
