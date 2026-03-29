import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { booksApi } from "@/api/books";
import type { Book } from "@/types/story";
import { chaptersKeys, scenesKeys } from "@/hooks/use-book-content";

export const booksKeys = {
  all: (seriesId: string) => ["series", seriesId, "books"] as const,
  detail: (seriesId: string, bookId: string) =>
    ["series", seriesId, "books", bookId] as const,
};

export function useBooksQuery(seriesId: string) {
  return useQuery({
    queryKey: booksKeys.all(seriesId),
    queryFn: () => booksApi.list(seriesId),
    enabled: !!seriesId,
  });
}

export function useBookQuery(seriesId: string, bookId: string) {
  return useQuery({
    queryKey: booksKeys.detail(seriesId, bookId),
    queryFn: () => booksApi.get(seriesId, bookId),
    enabled: !!(seriesId && bookId),
  });
}

export function useCreateBookMutation(seriesId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      data: Pick<Book, "title"> &
        Partial<Pick<Book, "author" | "publishDate" | "isbn" | "hasChapters">>,
    ) => booksApi.create(seriesId, data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: booksKeys.all(seriesId) }),
  });
}

export function useUpdateBookMutation(seriesId: string, bookId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      data: Partial<Pick<Book, "title" | "author" | "publishDate" | "isbn">>,
    ) => booksApi.update(seriesId, bookId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: booksKeys.all(seriesId) });
      qc.invalidateQueries({ queryKey: booksKeys.detail(seriesId, bookId) });
    },
  });
}

export function useDeleteBookMutation(seriesId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bookId: string) => booksApi.delete(seriesId, bookId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: booksKeys.all(seriesId) }),
  });
}

export function useToggleChaptersMutation(seriesId: string, bookId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (hasChapters: boolean) =>
      booksApi.toggleChapters(seriesId, bookId, hasChapters),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: booksKeys.detail(seriesId, bookId) });
      qc.invalidateQueries({ queryKey: booksKeys.all(seriesId) });
      qc.invalidateQueries({ queryKey: chaptersKeys.all(seriesId, bookId) });
      qc.invalidateQueries({ queryKey: scenesKeys.all(seriesId, bookId) });
    },
  });
}
