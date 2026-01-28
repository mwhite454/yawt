import { useSignal } from "@preact/signals";
import type { Character, Location, Scene } from "@utils/story/types.ts";

interface EventFormProps {
  seriesId: string;
  characters: Character[];
  locations: Location[];
  scenes: Array<Scene & { bookTitle?: string }>;
}

export default function EventForm(
  { seriesId, characters, locations, scenes }: EventFormProps,
) {
  const selectedCharacters = useSignal<string[]>([]);
  const selectedScenes = useSignal<string[]>([]);
  const tagInput = useSignal("");
  const tags = useSignal<string[]>([]);

  const toggleCharacter = (characterId: string) => {
    if (selectedCharacters.value.includes(characterId)) {
      selectedCharacters.value = selectedCharacters.value.filter((id) =>
        id !== characterId
      );
    } else {
      selectedCharacters.value = [...selectedCharacters.value, characterId];
    }
  };

  const toggleScene = (sceneId: string) => {
    if (selectedScenes.value.includes(sceneId)) {
      selectedScenes.value = selectedScenes.value.filter((id) =>
        id !== sceneId
      );
    } else {
      selectedScenes.value = [...selectedScenes.value, sceneId];
    }
  };

  const addTag = () => {
    const tag = tagInput.value.trim();
    if (tag && !tags.value.includes(tag)) {
      tags.value = [...tags.value, tag];
      tagInput.value = "";
    }
  };

  const removeTag = (tag: string) => {
    tags.value = tags.value.filter((t) => t !== tag);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      const trimmedValue = tagInput.value.trim();
      if (trimmedValue) {
        // Prevent form submission only if we're actually adding a tag
        e.preventDefault();
        addTag();
      }
      // If empty, allow default behavior (form submission)
    }
  };

  return (
    <form method="POST" class="grid gap-3">
      <input
        class="input input-bordered"
        name="title"
        placeholder="Event title"
        required
      />
      <textarea
        class="textarea textarea-bordered"
        name="description"
        placeholder="Description (optional)"
        rows={3}
      />

      <div class="grid md:grid-cols-2 gap-3">
        <div>
          <label class="label">
            <span class="label-text">Start Date (free-form text)</span>
          </label>
          <input
            type="text"
            class="input input-bordered w-full"
            name="startDate"
            placeholder='e.g. 2024-01-31 or "early spring 2025"'
          />
        </div>
        <div>
          <label class="label">
            <span class="label-text">End Date (free-form text)</span>
          </label>
          <input
            type="text"
            class="input input-bordered w-full"
            name="endDate"
            placeholder='e.g. 2024-02-15 or "after the battle"'
          />
        </div>
      </div>

      <div>
        <label class="label">
          <span class="label-text">Location</span>
        </label>
        <select class="select select-bordered w-full" name="locationId">
          <option value="">None</option>
          {locations.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label class="label">
          <span class="label-text">Characters</span>
        </label>
        <div class="border border-base-300 rounded-lg p-3 max-h-48 overflow-y-auto">
          {characters.length === 0 ? (
            <p class="text-sm opacity-60">No characters available</p>
          ) : (
            <div class="grid gap-2">
              {characters.map((char) => (
                <label
                  key={char.id}
                  class="flex items-center gap-2 cursor-pointer hover:bg-base-200 p-2 rounded"
                >
                  <input
                    type="checkbox"
                    class="checkbox checkbox-sm"
                    checked={selectedCharacters.value.includes(char.id)}
                    onChange={() => toggleCharacter(char.id)}
                  />
                  <span class="flex-1">{char.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>
        {/* Hidden inputs to submit selected characters */}
        {selectedCharacters.value.map((charId) => (
          <input
            key={charId}
            type="hidden"
            name="characterIds"
            value={charId}
          />
        ))}
      </div>

      <div>
        <label class="label">
          <span class="label-text">Scenes</span>
        </label>
        <div class="border border-base-300 rounded-lg p-3 max-h-48 overflow-y-auto">
          {scenes.length === 0 ? (
            <p class="text-sm opacity-60">No scenes available</p>
          ) : (
            <div class="grid gap-2">
              {scenes.map((scene) => {
                const sceneLabel = scene.derived?.title ||
                  `Scene ${scene.id.slice(0, 6)}`;
                return (
                  <label
                    key={scene.id}
                    class="flex items-center gap-2 cursor-pointer hover:bg-base-200 p-2 rounded"
                  >
                    <input
                      type="checkbox"
                      class="checkbox checkbox-sm"
                      checked={selectedScenes.value.includes(scene.id)}
                      onChange={() => toggleScene(scene.id)}
                    />
                    <span class="flex-1">
                      {sceneLabel}
                      {scene.bookTitle && (
                        <span class="text-sm opacity-60 ml-1">
                          ({scene.bookTitle})
                        </span>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
        {/* Hidden inputs to submit selected scenes */}
        {selectedScenes.value.map((sceneId) => (
          <input
            key={sceneId}
            type="hidden"
            name="sceneIds"
            value={sceneId}
          />
        ))}
      </div>

      <div>
        <label class="label">
          <span class="label-text">Plotlines / Tags</span>
        </label>
        <div class="flex gap-2">
          <input
            type="text"
            class="input input-bordered flex-1"
            placeholder="Add a tag..."
            value={tagInput.value}
            onInput={(e) => (tagInput.value = e.currentTarget.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            type="button"
            class="btn btn-secondary"
            onClick={addTag}
          >
            Add
          </button>
        </div>
        {tags.value.length > 0 && (
          <div class="flex flex-wrap gap-2 mt-2">
            {tags.value.map((tag) => (
              <div key={tag} class="badge badge-accent gap-2">
                {tag}
                <button
                  type="button"
                  class="btn btn-ghost btn-xs btn-circle"
                  onClick={() => removeTag(tag)}
                  aria-label={`Remove tag ${tag}`}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
        {/* Hidden inputs to submit tags */}
        {tags.value.map((tag) => (
          <input
            key={tag}
            type="hidden"
            name="tags"
            value={tag}
          />
        ))}
        <label class="label">
          <span class="label-text-alt">
            Enter tags and press Add or Enter
          </span>
        </label>
      </div>

      <div class="card-actions justify-end">
        <button class="btn btn-primary" type="submit">
          Create Event
        </button>
      </div>
    </form>
  );
}
