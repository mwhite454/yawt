import { useEffect, useState } from "preact/hooks";
import type { FieldDefinition, FieldType } from "@utils/story/types.ts";

type Props = {
  seriesId: string;
  typeId?: string;
  initialName?: string;
  initialDescription?: string;
  initialFields?: FieldDefinition[];
  onSuccess?: (typeId: string) => void;
};

export default function CharacterTypeEditor(props: Props) {
  const [name, setName] = useState(props.initialName ?? "");
  const [description, setDescription] = useState(
    props.initialDescription ?? "",
  );
  const [fields, setFields] = useState<FieldDefinition[]>(
    props.initialFields ?? [],
  );
  const [status, setStatus] = useState<
    "idle" | "saving" | "saved" | "error" | "deleting"
  >("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "saved") {
      const timer = setTimeout(() => setStatus("idle"), 2000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const handleAddField = () => {
    setFields([
      ...fields,
      {
        name: "",
        label: "",
        type: "text",
        required: false,
      },
    ]);
  };

  const handleUpdateField = (
    idx: number,
    updates: Partial<FieldDefinition>,
  ) => {
    const updated = [...fields];
    updated[idx] = { ...updated[idx], ...updates };
    setFields(updated);
  };

  const handleRemoveField = (idx: number) => {
    setFields(fields.filter((_, i) => i !== idx));
  };

  const handleAddOption = (idx: number) => {
    const updated = [...fields];
    const field = updated[idx];
    field.options = [...(field.options ?? []), ""];
    setFields(updated);
  };

  const handleUpdateOption = (
    fieldIdx: number,
    optionIdx: number,
    value: string,
  ) => {
    const updated = [...fields];
    const field = { ...updated[fieldIdx] };
    if (field.options) {
      field.options = [...field.options];
      field.options[optionIdx] = value;
      updated[fieldIdx] = field;
      setFields(updated);
    }
  };

  const handleRemoveOption = (fieldIdx: number, optionIdx: number) => {
    const updated = [...fields];
    const field = updated[fieldIdx];
    if (field.options) {
      field.options = field.options.filter((_, i) => i !== optionIdx);
      setFields(updated);
    }
  };

  const handleSave = async () => {
    try {
      setStatus("saving");
      setError(null);

      const method = props.typeId ? "PUT" : "POST";
      const url = props.typeId
        ? `/api/series/${props.seriesId}/character-types/${props.typeId}`
        : `/api/series/${props.seriesId}/character-types`;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ name, description, fields }),
      });

      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error || res.statusText);
      }

      const result = (await res.json()) as { characterType: { id: string } };
      setStatus("saved");

      if (props.onSuccess) {
        props.onSuccess(result.characterType.id);
      } else if (!props.typeId) {
        // Redirect to character types list
        window.location.href = `/series/${props.seriesId}/character-types`;
      }
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleDelete = async () => {
    if (!props.typeId) return;
    if (
      !confirm(
        "Are you sure you want to delete this character type? This cannot be undone.",
      )
    ) {
      return;
    }

    try {
      setStatus("deleting");
      setError(null);

      const res = await fetch(
        `/api/series/${props.seriesId}/character-types/${props.typeId}`,
        {
          method: "DELETE",
          credentials: "same-origin",
        },
      );

      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error || res.statusText);
      }

      window.location.href = `/series/${props.seriesId}/character-types`;
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div class="grid gap-4">
      <div class="grid gap-3">
        <div>
          <label class="label">
            <span class="label-text">Name</span>
          </label>
          <input
            class="input input-bordered w-full"
            type="text"
            value={name}
            onInput={(e) => {
              const target = e.currentTarget as HTMLInputElement;
              setName(target.value);
            }}
            placeholder="e.g., Lead Character, Supporting Character"
          />
        </div>

        <div>
          <label class="label">
            <span class="label-text">Description (optional)</span>
          </label>
          <textarea
            class="textarea textarea-bordered w-full"
            value={description}
            onInput={(e) => {
              const target = e.currentTarget as HTMLTextAreaElement;
              setDescription(target.value);
            }}
            placeholder="Describe when to use this character type"
            rows={2}
          />
        </div>
      </div>

      <div class="divider" />

      <div class="grid gap-3">
        <div class="flex items-center justify-between">
          <h3 class="font-semibold">Custom Fields</h3>
          <button
            class="btn btn-sm btn-primary"
            type="button"
            onClick={handleAddField}
          >
            Add Field
          </button>
        </div>

        {fields.length === 0 && (
          <div class="alert alert-info">
            <span>No custom fields yet. Click "Add Field" to create one.</span>
          </div>
        )}

        {fields.map((field, idx) => (
          <div key={idx} class="card bg-base-200">
            <div class="card-body p-4 gap-3">
              <div class="flex items-center justify-between">
                <div class="font-semibold text-sm">Field {idx + 1}</div>
                <button
                  class="btn btn-sm btn-ghost btn-circle"
                  type="button"
                  onClick={() => handleRemoveField(idx)}
                  title="Remove field"
                >
                  ✕
                </button>
              </div>

              <div class="grid md:grid-cols-2 gap-2">
                <div>
                  <label class="label py-1">
                    <span class="label-text text-xs">Field Name</span>
                  </label>
                  <input
                    class="input input-bordered input-sm w-full"
                    type="text"
                    value={field.name}
                    onInput={(e) => {
                      const target = e.currentTarget as HTMLInputElement;
                      handleUpdateField(idx, { name: target.value });
                    }}
                    placeholder="e.g., gender_identity"
                  />
                </div>

                <div>
                  <label class="label py-1">
                    <span class="label-text text-xs">Label</span>
                  </label>
                  <input
                    class="input input-bordered input-sm w-full"
                    type="text"
                    value={field.label}
                    onInput={(e) => {
                      const target = e.currentTarget as HTMLInputElement;
                      handleUpdateField(idx, { label: target.value });
                    }}
                    placeholder="e.g., Gender Identity"
                  />
                </div>

                <div>
                  <label class="label py-1">
                    <span class="label-text text-xs">Field Type</span>
                  </label>
                  <select
                    class="select select-bordered select-sm w-full"
                    value={field.type}
                    onChange={(e) => {
                      const target = e.currentTarget as HTMLSelectElement;
                      handleUpdateField(idx, {
                        type: target.value as FieldType,
                      });
                    }}
                  >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="textarea">Textarea</option>
                    <option value="select">Select (dropdown)</option>
                    <option value="list">List (multiple values)</option>
                  </select>
                </div>

                <div>
                  <label class="label py-1">
                    <span class="label-text text-xs">Required?</span>
                  </label>
                  <input
                    type="checkbox"
                    class="checkbox checkbox-sm"
                    checked={field.required ?? false}
                    onChange={(e) => {
                      const target = e.currentTarget as HTMLInputElement;
                      handleUpdateField(idx, { required: target.checked });
                    }}
                  />
                </div>
              </div>

              {field.type === "select" && (
                <div>
                  <div class="flex items-center justify-between mb-2">
                    <label class="label py-1">
                      <span class="label-text text-xs">Options</span>
                    </label>
                    <button
                      class="btn btn-xs btn-primary"
                      type="button"
                      onClick={() => handleAddOption(idx)}
                    >
                      Add Option
                    </button>
                  </div>
                  <div class="grid gap-2">
                    {(field.options ?? []).map((opt, optIdx) => (
                      <div key={optIdx} class="flex items-center gap-2">
                        <input
                          class="input input-bordered input-sm flex-1"
                          type="text"
                          value={opt}
                          onInput={(e) => {
                            const target = e.currentTarget as HTMLInputElement;
                            handleUpdateOption(idx, optIdx, target.value);
                          }}
                          placeholder={`Option ${optIdx + 1}`}
                        />
                        <button
                          class="btn btn-sm btn-ghost btn-circle"
                          type="button"
                          onClick={() =>
                            handleRemoveOption(idx, optIdx)}
                          title="Remove option"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div class="divider" />

      <div class="flex gap-2">
        <button
          class="btn btn-success"
          type="button"
          onClick={handleSave}
          disabled={status === "saving" || !name.trim()}
        >
          {status === "saving" ? "Saving..." : "Save Character Type"}
        </button>

        {props.typeId && (
          <button
            class="btn btn-error"
            type="button"
            onClick={handleDelete}
            disabled={status === "deleting"}
          >
            {status === "deleting" ? "Deleting..." : "Delete"}
          </button>
        )}

        <a
          href={`/series/${props.seriesId}/character-types`}
          class="btn btn-ghost"
        >
          Cancel
        </a>
      </div>

      {status === "saved" && (
        <div class="alert alert-success">
          <span>Saved successfully.</span>
        </div>
      )}

      {status === "error" && (
        <div class="alert alert-error">
          <span>Error: {error}</span>
        </div>
      )}
    </div>
  );
}
