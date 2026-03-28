import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { chaptersApi } from "@/api/chapters";
import { scenesApi } from "@/api/scenes";
import type { Chapter } from "@/types/story";

// ── Keys ────────────────────────────────────────────────────────────────────

export const chaptersKeys = {
  all: (seriesId: string, bookId: string) =>
    ["series", seriesId, "books", bookId, "chapters"] as const,
};

export const scenesKeys = {
  all: (seriesId: string, bookId: string) =>
    ["series", seriesId, "books", bookId, "scenes"] as const,
};

// ── Chapters ─────────────────────────────────────────────────────────────────

export function useChaptersQuery(seriesId: string, bookId: string) {
  return useQuery({
    queryKey: chaptersKeys.all(seriesId, bookId),
    queryFn: () => chaptersApi.list(seriesId, bookId),
    enabled: !!(seriesId && bookId),
  });
}

export function useCreateChapterMutation(seriesId: string, bookId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      data: Pick<Chapter, "title"> & Partial<Pick<Chapter, "description">>,
    ) => chaptersApi.create(seriesId, bookId, data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: chaptersKeys.all(seriesId, bookId) }),
  });
}

export function useUpdateChapterMutation(seriesId: string, bookId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      chapterId,
      data,
    }: {
      chapterId: string;
      data: Partial<Pick<Chapter, "title" | "description">>;
    }) => chaptersApi.update(seriesId, bookId, chapterId, data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: chaptersKeys.all(seriesId, bookId) }),
  });
}

export function useDeleteChapterMutation(seriesId: string, bookId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (chapterId: string) =>
      chaptersApi.delete(seriesId, bookId, chapterId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: chaptersKeys.all(seriesId, bookId) }),
  });
}

// ── Scenes ────────────────────────────────────────────────────────────────────

export function useScenesQuery(seriesId: string, bookId: string) {
  return useQuery({
    queryKey: scenesKeys.all(seriesId, bookId),
    queryFn: () => scenesApi.list(seriesId, bookId),
    enabled: !!(seriesId && bookId),
  });
}

export function useCreateSceneMutation(seriesId: string, bookId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { text?: string; chapterId?: string }) =>
      scenesApi.create(seriesId, bookId, data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: scenesKeys.all(seriesId, bookId) }),
  });
}

export function useUpdateSceneMutation(seriesId: string, bookId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      sceneId,
      data,
    }: {
      sceneId: string;
      data: { text?: string; chapterId?: string };
    }) => scenesApi.update(seriesId, bookId, sceneId, data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: scenesKeys.all(seriesId, bookId) }),
  });
}

export function useDeleteSceneMutation(seriesId: string, bookId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sceneId: string) =>
      scenesApi.delete(seriesId, bookId, sceneId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: scenesKeys.all(seriesId, bookId) }),
  });
}

export function useReorderItemsMutation(seriesId: string, bookId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      items: Array<{ type: "chapter" | "scene"; id: string; rank: string }>,
    ) => scenesApi.reorder(seriesId, bookId, items),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: chaptersKeys.all(seriesId, bookId) });
      qc.invalidateQueries({ queryKey: scenesKeys.all(seriesId, bookId) });
    },
  });
}
