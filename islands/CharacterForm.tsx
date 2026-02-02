import { useEffect, useState } from "preact/hooks";
import type { CharacterType, FieldDefinition } from "@utils/story/types.ts";

type Props = {
  seriesId: string;
  characterId?: string;
  characterTypes: CharacterType[];
  initialName?: string;
  initialDescription?: string;
  initialCharacterTypeId?: string;
  initialTypeData?: Record<string, unknown>;
  onSuccess?: () => void;
};

export default function CharacterForm(props: Props) {
  const [name, setName] = useState(props.initialName ?? "");
  const [description, setDescription] = useState(
    props.initialDescription ?? "",
  );
  const [characterTypeId, setCharacterTypeId] = useState(
    props.initialCharacterTypeId ?? "",
  );
  const [typeData, setTypeData] = useState<Record<string, unknown>>(
    props.initialTypeData ?? {},
  );
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  const selectedType = props.characterTypes.find(
    (ct) => ct.id === characterTypeId,
  );

  useEffect(() => {
    if (status === "saved") {
      const timer = setTimeout(() => setStatus("idle"), 2000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const handleTypeChange = (newTypeId: string) => {
    if (characterTypeId && newTypeId !== characterTypeId && Object.keys(typeData).length > 0) {
      if (!confirm("Changing the character type will clear all type-specific data. Continue?")) {
        return;
      }
    }
    setCharacterTypeId(newTypeId);
    // Reset type data when changing character type
    setTypeData({});
  };

  const handleFieldChange = (fieldName: string, value: unknown) => {
    setTypeData({ ...typeData, [fieldName]: value });
  };

  const handleListAdd = (fieldName: string) => {
    const current = typeData[fieldName] as string[] | undefined;
    setTypeData({
      ...typeData,
      [fieldName]: [...(current ?? []), ""],
    });
  };

  const handleListUpdate = (
    fieldName: string,
    index: number,
    value: string,
  ) => {
    const current = typeData[fieldName] as string[] | undefined;
    if (current) {
      const updated = [...current];
      updated[index] = value;
      setTypeData({ ...typeData, [fieldName]: updated });
    }
  };

  const handleListRemove = (fieldName: string, index: number) => {
    const current = typeData[fieldName] as string[] | undefined;
    if (current) {
      const updated = current.filter((_, i) => i !== index);
      setTypeData({ ...typeData, [fieldName]: updated });
    }
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    
    try {
      setStatus("saving");
      setError(null);

      const method = props.characterId ? "PUT" : "POST";
      const url = props.characterId
        ? `/api/series/${props.seriesId}/characters/${props.characterId}`
        : `/api/series/${props.seriesId}/characters`;

      const body: Record<string, unknown> = {
        name,
        description,
      };

      if (characterTypeId) {
        body.characterTypeId = characterTypeId;
        body.typeData = typeData;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const resBody = (await res.json()) as { error?: string };
        throw new Error(resBody.error || res.statusText);
      }

      setStatus("saved");

      if (props.onSuccess) {
        props.onSuccess();
      } else if (!props.characterId) {
        // Reset form for new character
        setName("");
        setDescription("");
        setCharacterTypeId("");
        setTypeData({});
        // Reload page to show new character
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const renderField = (field: FieldDefinition) => {
    const value = typeData[field.name];

    if (field.type === "text") {
      return (
        <div key={field.name}>
          <label class="label">
            <span class="label-text">
              {field.label}
              {field.required && <span class="text-error">*</span>}
            </span>
          </label>
          <input
            class="input input-bordered input-sm w-full"
            type="text"
            value={String(value ?? "")}
            onInput={(e) => {
              const target = e.currentTarget as HTMLInputElement;
              handleFieldChange(field.name, target.value);
            }}
            required={field.required}
          />
        </div>
      );
    }

    if (field.type === "select") {
      return (
        <div key={field.name}>
          <label class="label">
            <span class="label-text">
              {field.label}
              {field.required && <span class="text-error">*</span>}
            </span>
          </label>
          <select
            class="select select-bordered select-sm w-full"
            value={String(value ?? "")}
            onChange={(e) => {
              const target = e.currentTarget as HTMLSelectElement;
              handleFieldChange(field.name, target.value);
            }}
            required={field.required}
          >
            <option value="">-- Select --</option>
            {(field.options ?? []).map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (field.type === "list") {
      const listValues = (value as string[] | undefined) ?? [];
      return (
        <div key={field.name}>
          <label class="label">
            <span class="label-text">
              {field.label}
              {field.required && <span class="text-error">*</span>}
            </span>
          </label>
          <div class="grid gap-2">
            {listValues.map((item, idx) => (
              <div key={idx} class="flex items-center gap-2">
                <input
                  class="input input-bordered input-sm flex-1"
                  type="text"
                  value={item}
                  onInput={(e) => {
                    const target = e.currentTarget as HTMLInputElement;
                    handleListUpdate(field.name, idx, target.value);
                  }}
                />
                <button
                  class="btn btn-sm btn-ghost btn-circle"
                  type="button"
                  onClick={() => handleListRemove(field.name, idx)}
                  title="Remove item"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              class="btn btn-sm btn-outline"
              type="button"
              onClick={() => handleListAdd(field.name)}
            >
              Add Item
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <form onSubmit={handleSubmit} class="grid gap-3">
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
          required
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
          rows={3}
        />
      </div>

      {props.characterTypes.length > 0 && (
        <div>
          <label class="label">
            <span class="label-text">Character Type (optional)</span>
          </label>
          <select
            class="select select-bordered w-full"
            value={characterTypeId}
            onChange={(e) => {
              const target = e.currentTarget as HTMLSelectElement;
              handleTypeChange(target.value);
            }}
          >
            <option value="">-- No Type --</option>
            {props.characterTypes.map((ct) => (
              <option key={ct.id} value={ct.id}>
                {ct.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedType && selectedType.fields.length > 0 && (
        <>
          <div class="divider my-1">Type-Specific Fields</div>
          {selectedType.fields.map((field) => renderField(field))}
        </>
      )}

      <div class="card-actions justify-end mt-2">
        <button
          class="btn btn-primary"
          type="submit"
          disabled={status === "saving"}
        >
          {status === "saving"
            ? "Saving..."
            : props.characterId
            ? "Update Character"
            : "Add Character"}
        </button>
      </div>

      {status === "saved" && (
        <div class="alert alert-success py-2">
          <span>Saved successfully.</span>
        </div>
      )}

      {status === "error" && (
        <div class="alert alert-error py-2">
          <span>Error: {error}</span>
        </div>
      )}
    </form>
  );
}
