import CharacterTypeEditor from "../CharacterTypeEditor.tsx";
import type { FieldDefinition } from "@utils/story/types.ts";

const mockFields: FieldDefinition[] = [
  { name: "age", label: "Age", type: "number" as const, required: false },
  {
    name: "occupation",
    label: "Occupation",
    type: "text" as const,
    required: false,
  },
  {
    name: "backstory",
    label: "Backstory",
    type: "textarea" as const,
    required: false,
  },
];

export const NewCharacterType = () => (
  <div class="p-4">
    <CharacterTypeEditor
      seriesId="series-1"
      onSuccess={(typeId) => console.log("Created type:", typeId)}
    />
  </div>
);

export const EditCharacterType = () => (
  <div class="p-4">
    <CharacterTypeEditor
      seriesId="series-1"
      typeId="type-1"
      initialName="Main Character"
      initialDescription="Primary characters in the story"
      initialFields={mockFields}
      onSuccess={(typeId) => console.log("Updated type:", typeId)}
    />
  </div>
);

export const EmptyEdit = () => (
  <div class="p-4">
    <CharacterTypeEditor
      seriesId="series-1"
      typeId="type-1"
      onSuccess={(typeId) => console.log("Updated type:", typeId)}
    />
  </div>
);
