import { useState } from "react";
import { Plus, Trash2, UserRoundPen } from "lucide-react";
import { useParams, Link } from "react-router-dom";
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
  useCharactersQuery,
  useCreateCharacterMutation,
  useUpdateCharacterMutation,
  useDeleteCharacterMutation,
} from "@/hooks/use-characters";
import { useCharacterTypesQuery } from "@/hooks/use-character-types";
import type { Character } from "@/types/story";

type CharacterForm = {
  name: string;
  description: string;
  characterTypeId: string;
};

const emptyForm: CharacterForm = {
  name: "",
  description: "",
  characterTypeId: "",
};

export function CharactersPage() {
  const { seriesId = "" } = useParams<{ seriesId: string }>();
  const { data: characters = [], isLoading } = useCharactersQuery(seriesId);
  const { data: types = [] } = useCharacterTypesQuery(seriesId);

  const createCharacter = useCreateCharacterMutation(seriesId);
  const deleteCharacter = useDeleteCharacterMutation(seriesId);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<CharacterForm>(emptyForm);

  const [editingId, setEditingId] = useState<string | null>(null);
  const updateCharacter = useUpdateCharacterMutation(seriesId, editingId ?? "");
  const [editForm, setEditForm] = useState<CharacterForm>(emptyForm);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await createCharacter.mutateAsync({
      name: form.name,
      description: form.description || undefined,
      characterTypeId: form.characterTypeId || undefined,
    });
    setForm(emptyForm);
    setShowCreate(false);
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    await updateCharacter.mutateAsync({
      name: editForm.name,
      description: editForm.description || undefined,
      characterTypeId: editForm.characterTypeId || undefined,
    });
    setEditingId(null);
  }

  function openEdit(c: Character) {
    setEditingId(c.id);
    setEditForm({
      name: c.name,
      description: c.description ?? "",
      characterTypeId: c.characterTypeId ?? "",
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-6">
        <Spinner className="h-4 w-4 text-gray-400" />
        <p className="text-xs text-gray-400">Loading characters…</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-white/10 px-1 pb-2">
        <div className="space-y-1">
          <div className="panel-title">Characters</div>
          <h1 className="text-sm font-semibold text-white">
            People in this world
          </h1>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/series/${seriesId}/character-types`}
            className="inline-flex h-8 items-center rounded-lg border border-white/10 px-2 text-[11px] text-gray-300 transition-colors hover:bg-gray-800"
          >
            Manage Types
          </Link>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-3.5 w-3.5" />
            New Character
          </Button>
        </div>
      </div>

      {showCreate && (
        <Card className="max-w-xl">
          <CardHeader className="border-b border-white/10">
            <div className="panel-title">Create</div>
            <CardTitle>New Character</CardTitle>
            <CardDescription>
              Add the basics first. You can expand details later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-3">
              <Input
                placeholder="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <Textarea
                placeholder="Description"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
              {types.length > 0 && (
                <Select
                  value={form.characterTypeId}
                  onChange={(e) =>
                    setForm({ ...form, characterTypeId: e.target.value })
                  }
                >
                  <option value="">No type</option>
                  {types.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </Select>
              )}
              <div className="flex gap-2">
                <Button type="submit" disabled={createCharacter.isPending}>
                  {createCharacter.isPending ? <Spinner /> : null}
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

      {characters.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-sm font-semibold text-white">
              No characters yet.
            </p>
            <p className="text-xs text-gray-400">
              Create one to start tracking POVs, arcs, and relations.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {characters.map((c) => (
            <Card key={c.id}>
              {editingId === c.id ? (
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
                    {types.length > 0 && (
                      <Select
                        value={editForm.characterTypeId}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            characterTypeId: e.target.value,
                          })
                        }
                      >
                        <option value="">No type</option>
                        {types.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </Select>
                    )}
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        size="sm"
                        disabled={updateCharacter.isPending}
                      >
                        {updateCharacter.isPending ? <Spinner /> : null}
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
                    <p className="text-sm font-semibold text-white">{c.name}</p>
                    <UserRoundPen className="h-3.5 w-3.5 text-gray-500" />
                  </div>
                  <div className="space-y-1">
                    {c.description && (
                      <p className="text-xs text-gray-400">{c.description}</p>
                    )}
                    {c.characterTypeId && (
                      <Badge variant="outline" className="mt-1">
                        {types.find((t) => t.id === c.characterTypeId)?.name ??
                          "Unknown type"}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2 border-t border-white/10 pt-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEdit(c)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-400"
                      onClick={() => {
                        if (confirm(`Delete "${c.name}"?`))
                          deleteCharacter.mutate(c.id);
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
