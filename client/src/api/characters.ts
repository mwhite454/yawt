import { api } from "@/lib/api";
import type { Character } from "@/types/story";

export const charactersApi = {
  list: (seriesId: string) =>
    api.get<Character[]>(`/api/series/${seriesId}/characters`),
  get: (seriesId: string, characterId: string) =>
    api.get<Character>(`/api/series/${seriesId}/characters/${characterId}`),
  create: (
    seriesId: string,
    data: Pick<Character, "name"> &
      Partial<
        Pick<
          Character,
          "description" | "characterTypeId" | "typeData" | "extra"
        >
      >,
  ) => api.post<Character>(`/api/series/${seriesId}/characters`, data),
  update: (
    seriesId: string,
    characterId: string,
    data: Partial<
      Pick<
        Character,
        "name" | "description" | "characterTypeId" | "typeData" | "extra"
      >
    >,
  ) =>
    api.put<Character>(
      `/api/series/${seriesId}/characters/${characterId}`,
      data,
    ),
  delete: (seriesId: string, characterId: string) =>
    api.delete<void>(`/api/series/${seriesId}/characters/${characterId}`),
};
