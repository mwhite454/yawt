import KeyValueEditor from "../KeyValueEditor.tsx";

export const Empty = () => (
  <div class="p-4">
    <KeyValueEditor seriesId="series-1" characterId="char-1" />
  </div>
);

export const WithData = () => (
  <div class="p-4">
    <KeyValueEditor
      seriesId="series-1"
      characterId="char-1"
      initialExtra={{
        hairColor: "brown",
        eyeColor: "blue",
        height: "5'6\"",
        weight: "150 lbs",
      }}
    />
  </div>
);

export const SingleItem = () => (
  <div class="p-4">
    <KeyValueEditor
      seriesId="series-1"
      characterId="char-1"
      initialExtra={{
        favoriteFood: "Lembas bread",
      }}
    />
  </div>
);
