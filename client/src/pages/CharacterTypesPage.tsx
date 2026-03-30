import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  useCharacterTypesQuery,
  useCreateCharacterTypeMutation,
  useUpdateCharacterTypeMutation,
  useDeleteCharacterTypeMutation,
} from "@/hooks/use-character-types";
import type { CharacterType, FieldDefinition, FieldType } from "@/types/story";

const FIELD_TYPES: FieldType[] = [
  "text",
  "number",
  "textarea",
  "select",
  "list",
];

function FieldEditor({
  fields,
  onChange,
}: {
  fields: FieldDefinition[];
  onChange: (fields: FieldDefinition[]) => void;
}) {
  function addField() {
    onChange([...fields, { name: "", label: "", type: "text" }]);
  }

  function updateField(idx: number, patch: Partial<FieldDefinition>) {
    onChange(fields.map((f, i) => (i === idx ? { ...f, ...patch } : f)));
  }

  function removeField(idx: number) {
    onChange(fields.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-2">
      {fields.map((f, i) => (
        <div
          key={i}
          className="flex flex-wrap items-start gap-2 rounded-lg border border-white/10 bg-gray-900 p-2"
        >
          <Input
            className="w-36"
            placeholder="Field name (key)"
            value={f.name}
            onChange={(e) => updateField(i, { name: e.target.value })}
          />
          <Input
            className="w-36"
            placeholder="Label"
            value={f.label}
            onChange={(e) => updateField(i, { label: e.target.value })}
          />
          <Select
            className="w-32"
            value={f.type}
            onChange={(e) =>
              updateField(i, { type: e.target.value as FieldType })
            }
          >
            {FIELD_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
          {f.type === "select" && (
            <Input
              className="min-w-52 flex-1"
              placeholder="Options (comma-separated)"
              value={f.options?.join(", ") ?? ""}
              onChange={(e) =>
                updateField(i, {
                  options: e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
            />
          )}
          <label className="flex h-8 items-center gap-1 text-[11px] text-gray-400">
            <input
              type="checkbox"
              className="h-3.5 w-3.5 accent-blue-500"
              checked={f.required ?? false}
              onChange={(e) => updateField(i, { required: e.target.checked })}
            />
            Required
          </label>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-red-400"
            onClick={() => removeField(i)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
      <Button type="button" size="sm" variant="outline" onClick={addField}>
        <Plus className="h-3.5 w-3.5" />
        Add Field
      </Button>
    </div>
  );
}

type TypeForm = {
  name: string;
  description: string;
  fields: FieldDefinition[];
};
const emptyForm: TypeForm = { name: "", description: "", fields: [] };

export function CharacterTypesPage() {
  const { seriesId = "" } = useParams<{ seriesId: string }>();
  const { data: types = [], isLoading } = useCharacterTypesQuery(seriesId);

  const createType = useCreateCharacterTypeMutation(seriesId);
  const deleteType = useDeleteCharacterTypeMutation(seriesId);

  const [showCreate, setShowCreate] = useState(false);
  const [newForm, setNewForm] = useState<TypeForm>(emptyForm);

  const [editingId, setEditingId] = useState<string | null>(null);
  const updateType = useUpdateCharacterTypeMutation(seriesId, editingId ?? "");
  const [editForm, setEditForm] = useState<TypeForm>(emptyForm);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await createType.mutateAsync({
      name: newForm.name,
      description: newForm.description || undefined,
      fields: newForm.fields,
    });
    setNewForm(emptyForm);
    setShowCreate(false);
  }

  function openEdit(t: CharacterType) {
    setEditingId(t.id);
    setEditForm({
      name: t.name,
      description: t.description ?? "",
      fields: [...t.fields],
    });
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    await updateType.mutateAsync({
      name: editForm.name,
      description: editForm.description || undefined,
      fields: editForm.fields,
    });
    setEditingId(null);
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-6">
        <Spinner className="h-4 w-4 text-gray-400" />
        <p className="text-xs text-gray-400">Loading character types…</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-white/10 px-1 pb-2">
        <div className="space-y-1">
          <div className="panel-title">Character Types</div>
          <h1 className="text-sm font-semibold text-white">
            Schemas for character data
          </h1>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-3.5 w-3.5" />
          New Type
        </Button>
      </div>

      {showCreate && (
        <Card>
          <CardHeader className="border-b border-white/10">
            <div className="panel-title">Create</div>
            <CardTitle>New Character Type</CardTitle>
            <CardDescription>
              Define reusable fields for consistent character records.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-3">
              <Input
                placeholder="Name"
                value={newForm.name}
                onChange={(e) =>
                  setNewForm({ ...newForm, name: e.target.value })
                }
                required
              />
              <Textarea
                placeholder="Description"
                value={newForm.description}
                onChange={(e) =>
                  setNewForm({ ...newForm, description: e.target.value })
                }
              />
              <div>
                <p className="panel-title mb-2">Custom Fields</p>
                <FieldEditor
                  fields={newForm.fields}
                  onChange={(fields) => setNewForm({ ...newForm, fields })}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={createType.isPending}>
                  {createType.isPending ? <Spinner /> : null}
                  Create
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreate(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {types.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-sm font-semibold text-white">
              No character types yet.
            </p>
            <p className="text-xs text-gray-400">
              Create one so character entries can share structure.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {types.map((t) => (
            <Card key={t.id}>
              {editingId === t.id ? (
                <CardContent className="pt-3">
                  <form onSubmit={handleUpdate} className="space-y-2">
                    <Input
                      value={editForm.name}
                      onChange={(e) =>
                        setEditForm({ ...editForm, name: e.target.value })
                      }
                      required
                    />
                    <Textarea
                      value={editForm.description}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          description: e.target.value,
                        })
                      }
                    />
                    <div>
                      <p className="panel-title mb-2">Custom Fields</p>
                      <FieldEditor
                        fields={editForm.fields}
                        onChange={(fields) =>
                          setEditForm({ ...editForm, fields })
                        }
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        size="sm"
                        disabled={updateType.isPending}
                      >
                        {updateType.isPending ? <Spinner /> : null}
                        Save
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              ) : (
                <CardContent className="space-y-2 pt-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-white">{t.name}</p>
                    <Badge variant="outline">
                      {t.fields.length} field{t.fields.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    {t.description && (
                      <p className="text-xs text-gray-400">{t.description}</p>
                    )}
                    {t.fields.length > 0 && (
                      <p className="text-[11px] text-gray-500">
                        {t.fields.map((f) => f.label || f.name).join(", ")}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 border-t border-white/10 pt-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEdit(t)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-400"
                      onClick={() => {
                        if (confirm(`Delete "${t.name}"?`))
                          deleteType.mutate(t.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
