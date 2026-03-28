import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { seriesApi } from "@/api/series";
import type { Series } from "@/types/story";

export const seriesKeys = {
  all: ["series"] as const,
  detail: (id: string) => ["series", id] as const,
};

export function useSeriesListQuery() {
  return useQuery({
    queryKey: seriesKeys.all,
    queryFn: seriesApi.list,
  });
}

export function useSeriesQuery(id: string) {
  return useQuery({
    queryKey: seriesKeys.detail(id),
    queryFn: () => seriesApi.get(id),
    enabled: !!id,
  });
}

export function useCreateSeriesMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: seriesApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: seriesKeys.all }),
  });
}

export function useUpdateSeriesMutation(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Pick<Series, "title" | "description">>) =>
      seriesApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: seriesKeys.all });
      qc.invalidateQueries({ queryKey: seriesKeys.detail(id) });
    },
  });
}

export function useDeleteSeriesMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: seriesApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: seriesKeys.all }),
  });
}
