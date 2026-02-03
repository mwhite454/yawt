import CharacterForm from "../CharacterForm.tsx";
import type { CharacterType, FieldDefinition } from "@utils/story/types.ts";

const mockCharacterTypes: CharacterType[] = [
  {
    id: "type-1",
    userId: 12345,
    seriesId: "series-1",
    name: "Main Character",
    description: "Primary characters in the story",
    fields: [
      { name: "age", label: "Age", type: "number" as const, required: false },
      {
        name: "occupation",
        label: "Occupation",
        type: "text" as const,
        required: false,
      },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "type-2",
    userId: 12345,
    seriesId: "series-1",
    name: "Supporting Character",
    description: "Secondary characters",
    fields: [
      {
        name: "role",
        label: "Role",
        type: "text" as const,
        required: true,
      },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

export const NewCharacter = () => (
  <div class="p-4">
    <CharacterForm
      seriesId="series-1"
      characterTypes={mockCharacterTypes}
      onSuccess={() => console.log("Character created!")}
    />
  </div>
);

export const EditCharacter = () => (
  <div class="p-4">
    <CharacterForm
      seriesId="series-1"
      characterId="char-1"
      characterTypes={mockCharacterTypes}
      initialName="Frodo Baggins"
      initialDescription="A hobbit from the Shire"
      initialCharacterTypeId="type-1"
      initialTypeData={{ age: 50, occupation: "Ring Bearer" }}
      onSuccess={() => console.log("Character updated!")}
    />
  </div>
);

export const NoCharacterTypes = () => (
  <div class="p-4">
    <CharacterForm
      seriesId="series-1"
      characterTypes={[]}
      onSuccess={() => console.log("Character created!")}
    />
  </div>
);
