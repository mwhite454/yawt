import { useState } from "preact/hooks";

type Props = {
  seriesId: string;
  characterId: string;
  initialExtra?: Record<string, unknown>;
};

export default function KeyValueEditor(props: Props) {
  const [extra, setExtra] = useState<Record<string, unknown>>(
    props.initialExtra ?? {},
  );
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  const handleAdd = () => {
    const key = newKey.trim();
    const value = newValue.trim();

    if (!key) return;

    const updatedExtra = { ...extra, [key]: value || undefined };
    setExtra(updatedExtra);
    setNewKey("");
    setNewValue("");
  };

  const handleRemove = (key: string) => {
    const updatedExtra = { ...extra };
    delete updatedExtra[key];
    setExtra(updatedExtra);
  };

  const handleSave = async () => {
    try {
      setStatus("saving");
      setError(null);

      const res = await fetch(
        `/api/series/${props.seriesId}/characters/${props.characterId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ extra }),
        },
      );

      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error || res.statusText);
      }

      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const entries = Object.entries(extra);

  return (
    <div class="grid gap-3">
      <div class="font-semibold text-sm">Custom Attributes</div>

      {entries.length > 0 && (
        <div class="grid gap-2">
          {entries.map(([key, value]) => (
            <div key={key} class="flex items-center gap-2">
              <div class="flex-1 grid grid-cols-2 gap-2">
                <input
                  class="input input-bordered input-sm"
                  type="text"
                  value={key}
                  disabled
                />
                <input
                  class="input input-bordered input-sm"
                  type="text"
                  value={String(value ?? "")}
                  onChange={(e) => {
                    const target = e.currentTarget as HTMLInputElement;
                    setExtra({ ...extra, [key]: target.value || undefined });
                  }}
                />
              </div>
              <button
                class="btn btn-sm btn-ghost btn-circle"
                type="button"
                onClick={() =>
                  handleRemove(key)}
                title="Remove attribute"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <div class="divider my-1" />

      <div class="grid gap-2">
        <div class="grid grid-cols-2 gap-2">
          <input
            class="input input-bordered input-sm"
            type="text"
            placeholder="Key"
            value={newKey}
            onInput={(e) => {
              const target = e.currentTarget as HTMLInputElement;
              setNewKey(target.value);
            }}
          />
          <input
            class="input input-bordered input-sm"
            type="text"
            placeholder="Value"
            value={newValue}
            onInput={(e) => {
              const target = e.currentTarget as HTMLInputElement;
              setNewValue(target.value);
            }}
          />
        </div>
        <div class="flex gap-2">
          <button
            class="btn btn-sm btn-primary"
            type="button"
            onClick={handleAdd}
            disabled={!newKey.trim()}
          >
            Add Attribute
          </button>
          <button
            class="btn btn-sm btn-success"
            type="button"
            onClick={handleSave}
            disabled={status === "saving"}
          >
            {status === "saving" ? "Saving..." : "Save"}
          </button>
        </div>
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

      {entries.length === 0 && (
        <div class="text-xs opacity-60">
          No custom attributes yet. Add key-value pairs to store additional
          character information.
        </div>
      )}
    </div>
  );
}
