import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Alert } from "@/components/ui/alert";
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
  useSeriesListQuery,
  useCreateSeriesMutation,
  useDeleteSeriesMutation,
} from "@/hooks/use-series";
import { useAuth } from "@/contexts/AuthContext";

export function SeriesListPage() {
  const { user } = useAuth();
  const { data: series = [], isLoading } = useSeriesListQuery();
  const createMutation = useCreateSeriesMutation();
  const deleteMutation = useDeleteSeriesMutation();

  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await createMutation.mutateAsync({ title, description });
    setTitle("");
    setDescription("");
    setShowCreate(false);
  }

  const isFreeTier = !user?.role || user.role === "free";
  const atLimit = isFreeTier && series.length >= 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-white/10 px-1 pb-2">
        <div className="space-y-1">
          <div className="panel-title">Library</div>
          <h1 className="text-sm font-semibold text-white">My Series</h1>
        </div>
        {!atLimit && (
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-3.5 w-3.5" />
            New series
          </Button>
        )}
      </div>

      {atLimit && (
        <Alert variant="warning">
          Free tier is limited to 1 series. Upgrade to create more.
        </Alert>
      )}

      {showCreate && (
        <Card>
          <CardHeader className="border-b border-white/10">
            <div className="panel-title">Create</div>
            <CardTitle>New series</CardTitle>
            <CardDescription>
              Configure a title and optional description.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-3">
              <Input
                required
                placeholder="Series title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <Textarea
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
              <div className="flex flex-wrap gap-3">
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? <Spinner /> : null}
                  {createMutation.isPending ? "Creating" : "Create"}
                </Button>
                <Button variant="outline" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <Card>
          <CardContent className="flex items-center gap-2 py-3">
            <Spinner className="h-4 w-4 text-gray-400" />
            <p className="text-xs text-gray-400">Loading series…</p>
          </CardContent>
        </Card>
      ) : series.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col gap-2 py-8">
            <Badge variant="secondary" className="w-fit">
              Empty
            </Badge>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-white">No series yet.</p>
              <p className="text-xs text-gray-400">
                Create your first series to start organizing story assets.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {series.map((s) => (
            <Card key={s.id} className="overflow-hidden">
              <CardHeader className="border-b border-white/10">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-2">
                    <Badge variant="outline">Series</Badge>
                    <CardTitle>{s.title}</CardTitle>
                    <CardDescription>
                      {s.description || "No series description yet."}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-2 pt-3">
                <Link to={`/series/${s.id}`}>
                  <Button>Open</Button>
                </Link>
                <Button
                  variant="ghost"
                  className="text-red-400"
                  onClick={() => {
                    if (confirm(`Delete "${s.title}"?`)) {
                      deleteMutation.mutate(s.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
