import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useParams, Link } from "react-router-dom";
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
  useCreateTimelineMutation,
  useDeleteTimelineMutation,
} from "@/hooks/use-timelines";

export function TimelinesPage() {
  const { seriesId = "" } = useParams<{ seriesId: string }>();
  const { data: timelines = [], isLoading } = useTimelinesQuery(seriesId);
  const createTimeline = useCreateTimelineMutation(seriesId);
  const deleteTimeline = useDeleteTimelineMutation(seriesId);

  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await createTimeline.mutateAsync({
      title,
      description: description || undefined,
    });
    setTitle("");
    setDescription("");
    setShowCreate(false);
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-6">
        <Spinner className="h-4 w-4 text-gray-400" />
        <p className="text-xs text-gray-400">Loading timelines…</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-white/10 px-1 pb-2">
        <div className="space-y-1">
          <div className="panel-title">Timelines</div>
          <h1 className="text-sm font-semibold text-white">
            Chronology layers
          </h1>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-3.5 w-3.5" />
          New Timeline
        </Button>
      </div>

      {showCreate && (
        <Card className="max-w-xl">
          <CardHeader className="border-b border-white/10">
            <div className="panel-title">Create</div>
            <CardTitle>New Timeline</CardTitle>
            <CardDescription>
              Group events by chronology, arc, or perspective.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-3">
              <Input
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <Textarea
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <div className="flex gap-2">
                <Button type="submit" disabled={createTimeline.isPending}>
                  {createTimeline.isPending ? <Spinner /> : null}
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

      {timelines.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-sm font-semibold text-white">
              No timelines yet.
            </p>
            <p className="text-xs text-gray-400">
              Create one and start placing events in order.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {timelines.map((tl) => (
            <Card key={tl.id}>
              <CardContent className="space-y-2 pt-3">
                <div className="space-y-1">
                  <Link
                    to={`/series/${seriesId}/timelines/${tl.id}`}
                    className="text-sm font-semibold text-white transition-colors hover:text-blue-400"
                  >
                    {tl.title}
                  </Link>
                  {tl.description && (
                    <p className="text-xs text-gray-400">{tl.description}</p>
                  )}
                </div>
                <div className="flex gap-2 border-t border-white/10 pt-2">
                  <Link to={`/series/${seriesId}/timelines/${tl.id}`}>
                    <Button size="sm" variant="ghost">
                      View
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-400"
                    onClick={() => {
                      if (confirm(`Delete "${tl.title}"?`))
                        deleteTimeline.mutate(tl.id);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
