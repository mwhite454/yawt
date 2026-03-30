import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { characterTypesApi } from "@/api/character-types";
import type { CharacterType } from "@/types/story";

export const characterTypesKeys = {
  all: (seriesId: string) => ["series", seriesId, "character-types"] as const,
};

export function useCharacterTypesQuery(seriesId: string) {
  return useQuery({
    queryKey: characterTypesKeys.all(seriesId),
    queryFn: () => characterTypesApi.list(seriesId),
    enabled: !!seriesId,
  });
}

export function useCreateCharacterTypeMutation(seriesId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      data: Pick<CharacterType, "name"> &
        Partial<Pick<CharacterType, "description" | "fields">>,
    ) => characterTypesApi.create(seriesId, data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: characterTypesKeys.all(seriesId) }),
  });
}

export function useUpdateCharacterTypeMutation(
  seriesId: string,
  typeId: string,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      data: Partial<Pick<CharacterType, "name" | "description" | "fields">>,
    ) => characterTypesApi.update(seriesId, typeId, data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: characterTypesKeys.all(seriesId) }),
  });
}

export function useDeleteCharacterTypeMutation(seriesId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (typeId: string) => characterTypesApi.delete(seriesId, typeId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: characterTypesKeys.all(seriesId) }),
  });
}
