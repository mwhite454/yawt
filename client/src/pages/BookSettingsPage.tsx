import { useState, useEffect } from "react";
import { ChevronLeft, Trash2 } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  useBookQuery,
  useUpdateBookMutation,
  useDeleteBookMutation,
} from "@/hooks/use-books";

export function BookSettingsPage() {
  const { seriesId = "", bookId = "" } = useParams<{
    seriesId: string;
    bookId: string;
  }>();
  const navigate = useNavigate();

  const { data: book, isLoading } = useBookQuery(seriesId, bookId);
  const updateBook = useUpdateBookMutation(seriesId, bookId);
  const deleteBook = useDeleteBookMutation(seriesId);

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [publishDate, setPublishDate] = useState("");
  const [isbn, setIsbn] = useState("");

  useEffect(() => {
    if (book) {
      setTitle(book.title ?? "");
      setAuthor(book.author ?? "");
      setPublishDate(book.publishDate ?? "");
      setIsbn(book.isbn ?? "");
    }
  }, [book]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    await updateBook.mutateAsync({ title, author, publishDate, isbn });
  }

  async function handleDelete() {
    if (!confirm(`Delete "${book?.title}"? This cannot be undone.`)) return;
    await deleteBook.mutateAsync(bookId);
    navigate(`/series/${seriesId}`);
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-6">
        <Spinner className="h-4 w-4 text-gray-400" />
        <p className="text-xs text-gray-400">Loading book settings…</p>
      </div>
    );
  }

  if (!book) return <p className="p-6 text-red-400">Book not found.</p>;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="space-y-1 border-b border-white/10 px-1 pb-2">
        <button
          type="button"
          onClick={() => navigate(`/series/${seriesId}/books/${bookId}`)}
          className="inline-flex items-center gap-1 text-[11px] text-gray-400 transition-colors hover:text-white"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Back to manuscript
        </button>
        <div className="panel-title">Book Settings</div>
        <h1 className="text-sm font-semibold text-white">{book.title}</h1>
      </div>

      <Card>
        <CardHeader className="border-b border-white/10">
          <CardTitle>Metadata</CardTitle>
        </CardHeader>
        <CardContent className="pt-2.5">
          <form onSubmit={handleSave} className="space-y-3">
            <div className="space-y-1">
              <div className="panel-title">Title</div>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <div className="panel-title">Author</div>
              <Input
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <div className="panel-title">Publish Date</div>
              <Input
                type="date"
                value={publishDate}
                onChange={(e) => setPublishDate(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <div className="panel-title">ISBN</div>
              <Input value={isbn} onChange={(e) => setIsbn(e.target.value)} />
            </div>

            <Button type="submit" disabled={updateBook.isPending}>
              {updateBook.isPending ? <Spinner /> : null}
              Save
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-white/10">
          <CardTitle className="text-red-400">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-2.5">
          <Alert variant="warning">
            Deleting a book removes its chapters and scenes from this series.
          </Alert>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-3.5 w-3.5" />
            Delete Book
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
