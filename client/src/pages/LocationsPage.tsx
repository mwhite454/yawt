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
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  useLocationsQuery,
  useCreateLocationMutation,
  useUpdateLocationMutation,
  useDeleteLocationMutation,
} from "@/hooks/use-locations";
import type { Location } from "@/types/story";

type LocationForm = { name: string; description: string; tags: string };
const emptyForm: LocationForm = { name: "", description: "", tags: "" };

function formToTags(s: string): string[] {
  return s
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export function LocationsPage() {
  const { seriesId = "" } = useParams<{ seriesId: string }>();
  const { data: locations = [], isLoading } = useLocationsQuery(seriesId);

  const createLocation = useCreateLocationMutation(seriesId);
  const deleteLocation = useDeleteLocationMutation(seriesId);

  const [showCreate, setShowCreate] = useState(false);
  const [newForm, setNewForm] = useState<LocationForm>(emptyForm);

  const [editingId, setEditingId] = useState<string | null>(null);
  const updateLocation = useUpdateLocationMutation(seriesId, editingId ?? "");
  const [editForm, setEditForm] = useState<LocationForm>(emptyForm);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await createLocation.mutateAsync({
      name: newForm.name,
      description: newForm.description || undefined,
      tags: formToTags(newForm.tags),
    });
    setNewForm(emptyForm);
    setShowCreate(false);
  }

  function openEdit(loc: Location) {
    setEditingId(loc.id);
    setEditForm({
      name: loc.name,
      description: loc.description ?? "",
      tags: (loc.tags ?? []).join(", "),
    });
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    await updateLocation.mutateAsync({
      name: editForm.name,
      description: editForm.description || undefined,
      tags: formToTags(editForm.tags),
    });
    setEditingId(null);
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-6">
        <Spinner className="h-4 w-4 text-gray-400" />
        <p className="text-xs text-gray-400">Loading locations…</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-white/10 px-1 pb-2">
        <div className="space-y-1">
          <div className="panel-title">Locations</div>
          <h1 className="text-sm font-semibold text-white">
            Places and settings
          </h1>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-3.5 w-3.5" />
          New Location
        </Button>
      </div>

      {showCreate && (
        <Card className="max-w-xl">
          <CardHeader className="border-b border-white/10">
            <div className="panel-title">Create</div>
            <CardTitle>New Location</CardTitle>
            <CardDescription>
              Add a location and tags to keep scene settings queryable.
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
              <Input
                placeholder="Tags (comma-separated)"
                value={newForm.tags}
                onChange={(e) =>
                  setNewForm({ ...newForm, tags: e.target.value })
                }
              />
              <div className="flex gap-2">
                <Button type="submit" disabled={createLocation.isPending}>
                  {createLocation.isPending ? <Spinner /> : null}
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

      {locations.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-sm font-semibold text-white">
              No locations yet.
            </p>
            <p className="text-xs text-gray-400">
              Create one to track places, geography, and references.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {locations.map((loc) => (
            <Card key={loc.id}>
              {editingId === loc.id ? (
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
                    <Input
                      placeholder="Tags (comma-separated)"
                      value={editForm.tags}
                      onChange={(e) =>
                        setEditForm({ ...editForm, tags: e.target.value })
                      }
                    />
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        size="sm"
                        disabled={updateLocation.isPending}
                      >
                        {updateLocation.isPending ? <Spinner /> : null}
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
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-white">
                      {loc.name}
                    </p>
                    {loc.description && (
                      <p className="text-xs text-gray-400">{loc.description}</p>
                    )}
                    {loc.tags && loc.tags.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {loc.tags.map((tag) => (
                          <Badge key={tag} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 border-t border-white/10 pt-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEdit(loc)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-400"
                      onClick={() => {
                        if (confirm(`Delete "${loc.name}"?`))
                          deleteLocation.mutate(loc.id);
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
