import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { charactersApi } from "@/api/characters";
import type { Character } from "@/types/story";

export const charactersKeys = {
  all: (seriesId: string) => ["series", seriesId, "characters"] as const,
  detail: (seriesId: string, characterId: string) =>
    ["series", seriesId, "characters", characterId] as const,
};

export function useCharactersQuery(seriesId: string) {
  return useQuery({
    queryKey: charactersKeys.all(seriesId),
    queryFn: () => charactersApi.list(seriesId),
    enabled: !!seriesId,
  });
}

export function useCreateCharacterMutation(seriesId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      data: Pick<Character, "name"> &
        Partial<
          Pick<
            Character,
            "description" | "characterTypeId" | "typeData" | "extra"
          >
        >,
    ) => charactersApi.create(seriesId, data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: charactersKeys.all(seriesId) }),
  });
}

export function useUpdateCharacterMutation(
  seriesId: string,
  characterId: string,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      data: Partial<
        Pick<
          Character,
          "name" | "description" | "characterTypeId" | "typeData" | "extra"
        >
      >,
    ) => charactersApi.update(seriesId, characterId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: charactersKeys.all(seriesId) });
      qc.invalidateQueries({
        queryKey: charactersKeys.detail(seriesId, characterId),
      });
    },
  });
}

export function useDeleteCharacterMutation(seriesId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (characterId: string) =>
      charactersApi.delete(seriesId, characterId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: charactersKeys.all(seriesId) }),
  });
}
