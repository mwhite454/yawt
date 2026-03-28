import { useState } from "react";
import { BookPlus, ChevronLeft, Settings2, Trash2 } from "lucide-react";
import { useParams, Link } from "react-router-dom";
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
import { useSeriesQuery } from "@/hooks/use-series";
import {
  useBooksQuery,
  useCreateBookMutation,
  useDeleteBookMutation,
} from "@/hooks/use-books";
import { useAuth } from "@/contexts/AuthContext";

export function SeriesDetailPage() {
  const { seriesId = "" } = useParams<{ seriesId: string }>();
  const { user } = useAuth();
  const { data: series } = useSeriesQuery(seriesId);
  const { data: books = [], isLoading } = useBooksQuery(seriesId);
  const createMutation = useCreateBookMutation(seriesId);
  const deleteMutation = useDeleteBookMutation(seriesId);

  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");

  const isFreeTier = !user?.role || user.role === "free";
  const atLimit = isFreeTier && books.length >= 3;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await createMutation.mutateAsync({ title, author: author || undefined });
    setTitle("");
    setAuthor("");
    setShowCreate(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between border-b border-white/10 px-1 pb-2">
        <div className="space-y-1">
          <Link
            to="/series"
            className="inline-flex items-center gap-1 text-[11px] text-gray-400 transition-colors hover:text-white"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            All series
          </Link>
          <div className="space-y-1">
            <div className="panel-title">Series Workspace</div>
            <h1 className="text-sm font-semibold text-white">
              {series?.title ?? "Loading…"}
            </h1>
            {series?.description && (
              <p className="max-w-3xl text-[11px] text-gray-400">
                {series.description}
              </p>
            )}
          </div>
        </div>
        {!atLimit && (
          <Button onClick={() => setShowCreate(true)}>
            <BookPlus className="h-3.5 w-3.5" />
            New book
          </Button>
        )}
      </div>

      {atLimit && (
        <Alert variant="warning">
          Free tier is limited to 3 books per series. Upgrade to add more.
        </Alert>
      )}

      {showCreate && (
        <Card>
          <CardHeader className="border-b border-white/10">
            <div className="panel-title">Create</div>
            <CardTitle>Add a book to this series</CardTitle>
            <CardDescription>Add a title and optional author.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-3">
              <Input
                required
                placeholder="Book title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <Input
                placeholder="Author name"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
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
            <p className="text-xs text-gray-400">Loading books…</p>
          </CardContent>
        </Card>
      ) : books.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <Badge variant="secondary" className="mb-2 w-fit">
              Empty
            </Badge>
            <p className="text-sm font-semibold text-white">No books yet.</p>
            <p className="mt-1 text-xs text-gray-400">
              Create the first book to begin scenes and timelines.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {books.map((book) => (
            <Card key={book.id} className="overflow-hidden">
              <CardHeader className="border-b border-white/10">
                <Badge variant="outline" className="w-fit">
                  Book
                </Badge>
                <CardTitle>{book.title}</CardTitle>
                <CardDescription>
                  {book.author ? `by ${book.author}` : "Author not set yet."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-3">
                <div className="flex flex-wrap gap-2">
                  <Link to={`/series/${seriesId}/books/${book.id}`}>
                    <Button>Open manuscript</Button>
                  </Link>
                </div>
                <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-3">
                  <Link
                    to={`/series/${seriesId}/books/${book.id}/settings`}
                    className="inline-flex items-center gap-1 text-[11px] text-gray-400 transition-colors hover:text-white"
                  >
                    <Settings2 className="h-3.5 w-3.5" />
                    Settings
                  </Link>
                  <Button
                    variant="ghost"
                    className="text-red-400"
                    onClick={() => {
                      if (confirm(`Delete "${book.title}"?`)) {
                        deleteMutation.mutate(book.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
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
