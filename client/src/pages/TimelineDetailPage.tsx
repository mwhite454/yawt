import { useState } from "react";
import { ChevronLeft, Plus, Trash2 } from "lucide-react";
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
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  useTimelinesQuery,
  useTimelineEventsQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  useDeleteEventMutation,
} from "@/hooks/use-timelines";
import type { Event } from "@/types/story";

type EventForm = {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  tags: string;
};

const emptyEventForm: EventForm = {
  title: "",
  description: "",
  startDate: "",
  endDate: "",
  tags: "",
};

function formToTags(s: string): string[] {
  return s
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export function TimelineDetailPage() {
  const { seriesId = "", timelineId = "" } = useParams<{
    seriesId: string;
    timelineId: string;
  }>();

  const { data: timelines = [] } = useTimelinesQuery(seriesId);
  const { data: events = [], isLoading } = useTimelineEventsQuery(
    seriesId,
    timelineId,
  );

  const createEvent = useCreateEventMutation(seriesId, timelineId);
  const deleteEvent = useDeleteEventMutation(seriesId, timelineId);

  const [showCreate, setShowCreate] = useState(false);
  const [newForm, setNewForm] = useState<EventForm>(emptyEventForm);

  const [editingId, setEditingId] = useState<string | null>(null);
  const updateEvent = useUpdateEventMutation(seriesId, timelineId);
  const [editForm, setEditForm] = useState<EventForm>(emptyEventForm);

  const timeline = timelines.find((t) => t.id === timelineId);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await createEvent.mutateAsync({
      title: newForm.title,
      description: newForm.description || undefined,
      startDate: newForm.startDate || undefined,
      endDate: newForm.endDate || undefined,
      tags: formToTags(newForm.tags),
    });
    setNewForm(emptyEventForm);
    setShowCreate(false);
  }

  function openEdit(ev: Event) {
    setEditingId(ev.id);
    setEditForm({
      title: ev.title,
      description: ev.description ?? "",
      startDate: ev.startDate ?? "",
      endDate: ev.endDate ?? "",
      tags: (ev.tags ?? []).join(", "),
    });
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    await updateEvent.mutateAsync({
      eventId: editingId!,
      data: {
        title: editForm.title,
        description: editForm.description || undefined,
        startDate: editForm.startDate || undefined,
        endDate: editForm.endDate || undefined,
        tags: formToTags(editForm.tags),
      },
    });
    setEditingId(null);
  }

  // Sort events by startDate ascending (undated at end)
  const sortedEvents = [...events].sort((a, b) => {
    if (!a.startDate && !b.startDate) return 0;
    if (!a.startDate) return 1;
    if (!b.startDate) return -1;
    return a.startDate < b.startDate ? -1 : 1;
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-6">
        <Spinner className="h-4 w-4 text-gray-400" />
        <p className="text-xs text-gray-400">Loading events…</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between border-b border-white/10 px-1 pb-2">
        <div className="space-y-1">
          <Link
            to={`/series/${seriesId}/timelines`}
            className="inline-flex items-center gap-1 text-[11px] text-gray-400 transition-colors hover:text-white"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Timelines
          </Link>
          <div className="panel-title">Timeline</div>
          <h1 className="text-sm font-semibold text-white">
            {timeline?.title ?? "Timeline"}
          </h1>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-3.5 w-3.5" />
          New Event
        </Button>
      </div>

      {timeline?.description && (
        <p className="text-xs text-gray-400">{timeline.description}</p>
      )}

      {showCreate && (
        <Card className="max-w-2xl">
          <CardHeader className="border-b border-white/10">
            <div className="panel-title">Create</div>
            <CardTitle>New Event</CardTitle>
            <CardDescription>
              Add a dated or undated event to this timeline.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-3">
              <Input
                placeholder="Title"
                value={newForm.title}
                onChange={(e) =>
                  setNewForm({ ...newForm, title: e.target.value })
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
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <p className="panel-title mb-1">Start Date</p>
                  <Input
                    type="date"
                    value={newForm.startDate}
                    onChange={(e) =>
                      setNewForm({ ...newForm, startDate: e.target.value })
                    }
                  />
                </div>
                <div>
                  <p className="panel-title mb-1">End Date</p>
                  <Input
                    type="date"
                    value={newForm.endDate}
                    onChange={(e) =>
                      setNewForm({ ...newForm, endDate: e.target.value })
                    }
                  />
                </div>
              </div>
              <Input
                placeholder="Tags (comma-separated)"
                value={newForm.tags}
                onChange={(e) =>
                  setNewForm({ ...newForm, tags: e.target.value })
                }
              />
              <div className="flex gap-2">
                <Button type="submit" disabled={createEvent.isPending}>
                  {createEvent.isPending ? <Spinner /> : null}
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

      {sortedEvents.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-sm font-semibold text-white">No events yet.</p>
            <p className="text-xs text-gray-400">
              Create one to start tracking chronology.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {sortedEvents.map((ev) => (
            <Card key={ev.id}>
              {editingId === ev.id ? (
                <CardContent className="pt-3">
                  <form onSubmit={handleUpdate} className="space-y-2">
                    <Input
                      value={editForm.title}
                      onChange={(e) =>
                        setEditForm({ ...editForm, title: e.target.value })
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
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Input
                        type="date"
                        value={editForm.startDate}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            startDate: e.target.value,
                          })
                        }
                      />
                      <Input
                        type="date"
                        value={editForm.endDate}
                        onChange={(e) =>
                          setEditForm({ ...editForm, endDate: e.target.value })
                        }
                      />
                    </div>
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
                        disabled={updateEvent.isPending}
                      >
                        {updateEvent.isPending ? <Spinner /> : null}
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
                      {ev.title}
                    </p>
                    {ev.description && (
                      <p className="text-xs text-gray-400">{ev.description}</p>
                    )}
                    <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-gray-500">
                      {ev.startDate && <span>From: {ev.startDate}</span>}
                      {ev.endDate && <span>To: {ev.endDate}</span>}
                    </div>
                    {ev.tags && ev.tags.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {ev.tags.map((tag) => (
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
                      onClick={() => openEdit(ev)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-400"
                      onClick={() => {
                        if (confirm(`Delete "${ev.title}"?`))
                          deleteEvent.mutate(ev.id);
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
