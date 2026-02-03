import CharacterImageUploader from "../CharacterImageUploader.tsx";

export const NoImage = () => (
  <div class="p-4">
    <CharacterImageUploader seriesId="series-1" characterId="char-1" />
  </div>
);

export const WithExistingImage = () => (
  <div class="p-4">
    <CharacterImageUploader
      seriesId="series-1"
      characterId="char-1"
      existingObjectKey="characters/char-1/image.jpg"
      existingContentType="image/jpeg"
    />
  </div>
);
