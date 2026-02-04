import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";

interface TagInputProps {
  seriesId: string;
  initialTags?: string[];
  name?: string;
  label?: string;
}

export default function TagInput({
  seriesId,
  initialTags = [],
  name = "tags",
  label = "Plotlines / Tags",
}: TagInputProps) {
  const tagInput = useSignal("");
  const tags = useSignal<string[]>(initialTags);
  const suggestions = useSignal<string[]>([]);
  const showSuggestions = useSignal(false);

  useEffect(() => {
    // Fetch existing tags from the series
    fetch(`/api/series/${seriesId}/tags`)
      .then((res) => res.json())
      .then((data) => {
        if (data.tags && Array.isArray(data.tags)) {
          suggestions.value = data.tags;
        }
      })
      .catch((err) => console.error("Failed to fetch tags:", err));
  }, [seriesId]);

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !tags.value.includes(trimmedTag)) {
      tags.value = [...tags.value, trimmedTag];
      tagInput.value = "";
      showSuggestions.value = false;
    }
  };

  const removeTag = (tag: string) => {
    tags.value = tags.value.filter((t) => t !== tag);
  };

  const handleInput = (e: Event) => {
    const value = (e.currentTarget as HTMLInputElement).value;
    tagInput.value = value;
    showSuggestions.value = value.length > 0;
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      const trimmedValue = tagInput.value.trim();
      if (trimmedValue) {
        e.preventDefault();
        addTag(trimmedValue);
      }
    } else if (e.key === "Escape") {
      showSuggestions.value = false;
    }
  };

  const filteredSuggestions = suggestions.value.filter(
    (s) =>
      !tags.value.includes(s) &&
      s.toLowerCase().includes(tagInput.value.toLowerCase()),
  );

  return (
    <div>
      <label class="label">
        <span class="label-text">{label}</span>
      </label>
      <div class="relative">
        <div class="flex gap-2">
          <input
            type="text"
            class="input input-bordered flex-1"
            placeholder="Add a tag..."
            value={tagInput.value}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onFocus={() => showSuggestions.value = tagInput.value.length > 0}
          />
          <button
            type="button"
            class="btn btn-secondary"
            onClick={() => addTag(tagInput.value)}
          >
            Add
          </button>
        </div>

        {showSuggestions.value && filteredSuggestions.length > 0 && (
          <div class="absolute z-10 w-full mt-1 bg-base-100 border border-base-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {filteredSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                class="w-full text-left px-4 py-2 hover:bg-base-200 cursor-pointer"
                onClick={() => addTag(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      {tags.value.length > 0 && (
        <div class="flex flex-wrap gap-2 mt-2">
          {tags.value.map((tag) => (
            <div key={tag} class="badge badge-accent gap-2">
              {tag}
              <button
                type="button"
                class="btn btn-ghost btn-xs btn-circle"
                onClick={() =>
                  removeTag(tag)}
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
        <input key={tag} type="hidden" name={name} value={tag} />
      ))}

      <label class="label">
        <span class="label-text-alt">
          Enter tags and press Add or Enter. Existing tags will be suggested.
        </span>
      </label>
    </div>
  );
}
