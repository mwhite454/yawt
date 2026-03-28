import { api } from "@/lib/api";
import type { CharacterType } from "@/types/story";

export const characterTypesApi = {
  list: (seriesId: string) =>
    api.get<CharacterType[]>(`/api/series/${seriesId}/character-types`),
  get: (seriesId: string, typeId: string) =>
    api.get<CharacterType>(`/api/series/${seriesId}/character-types/${typeId}`),
  create: (
    seriesId: string,
    data: Pick<CharacterType, "name"> &
      Partial<Pick<CharacterType, "description" | "fields">>,
  ) => api.post<CharacterType>(`/api/series/${seriesId}/character-types`, data),
  update: (
    seriesId: string,
    typeId: string,
    data: Partial<Pick<CharacterType, "name" | "description" | "fields">>,
  ) =>
    api.put<CharacterType>(
      `/api/series/${seriesId}/character-types/${typeId}`,
      data,
    ),
  delete: (seriesId: string, typeId: string) =>
    api.delete<void>(`/api/series/${seriesId}/character-types/${typeId}`),
};
