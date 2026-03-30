import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { locationsApi } from "@/api/locations";
import type { Location } from "@/types/story";

export const locationsKeys = {
  all: (seriesId: string) => ["series", seriesId, "locations"] as const,
};

export function useLocationsQuery(seriesId: string) {
  return useQuery({
    queryKey: locationsKeys.all(seriesId),
    queryFn: () => locationsApi.list(seriesId),
    enabled: !!seriesId,
  });
}

export function useCreateLocationMutation(seriesId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      data: Pick<Location, "name"> &
        Partial<Pick<Location, "description" | "tags" | "coords" | "extra">>,
    ) => locationsApi.create(seriesId, data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: locationsKeys.all(seriesId) }),
  });
}

export function useUpdateLocationMutation(
  seriesId: string,
  locationId: string,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      data: Partial<
        Pick<Location, "name" | "description" | "tags" | "coords" | "extra">
      >,
    ) => locationsApi.update(seriesId, locationId, data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: locationsKeys.all(seriesId) }),
  });
}

export function useDeleteLocationMutation(seriesId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (locationId: string) =>
      locationsApi.delete(seriesId, locationId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: locationsKeys.all(seriesId) }),
  });
}
