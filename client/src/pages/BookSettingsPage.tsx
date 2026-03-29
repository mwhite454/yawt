import { useState, useEffect } from "react";
import { ChevronLeft, Layers, Trash2 } from "lucide-react";
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
  useToggleChaptersMutation,
} from "@/hooks/use-books";
import { useChaptersQuery, useScenesQuery } from "@/hooks/use-book-content";

export function BookSettingsPage() {
  const { seriesId = "", bookId = "" } = useParams<{
    seriesId: string;
    bookId: string;
  }>();
  const navigate = useNavigate();

  const { data: book, isLoading } = useBookQuery(seriesId, bookId);
  const { data: chapters = [] } = useChaptersQuery(seriesId, bookId);
  const { data: scenes = [] } = useScenesQuery(seriesId, bookId);
  const updateBook = useUpdateBookMutation(seriesId, bookId);
  const deleteBook = useDeleteBookMutation(seriesId);
  const toggleChapters = useToggleChaptersMutation(seriesId, bookId);

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [publishDate, setPublishDate] = useState("");
  const [isbn, setIsbn] = useState("");
  const [showFlattenModal, setShowFlattenModal] = useState(false);

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

  function handleChaptersToggle() {
    const currentlyHasChapters = book?.hasChapters !== false;
    if (currentlyHasChapters) {
      // Turning off — show confirmation modal
      setShowFlattenModal(true);
    } else {
      // Turning on — no confirmation needed
      toggleChapters.mutate(true);
    }
  }

  async function handleConfirmFlatten() {
    await toggleChapters.mutateAsync(false);
    setShowFlattenModal(false);
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

  const hasChapters = book.hasChapters !== false;
  const chapterSceneCount = scenes.filter((s) => s.chapterId).length;

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
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-gray-400" />
            Organization
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2.5 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="panel-title mb-1">Organize scenes into chapters</div>
              <p className="text-[11px] text-gray-400 max-w-sm">
                Chapters group scenes and add page breaks when exporting.
                {hasChapters
                  ? ` This book has ${chapters.length} chapter${chapters.length !== 1 ? "s" : ""}.`
                  : " This book uses a flat scene list."}
              </p>
            </div>
            <button
              type="button"
              onClick={handleChaptersToggle}
              disabled={toggleChapters.isPending}
              className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                hasChapters ? "bg-indigo-500" : "bg-gray-600"
              } ${toggleChapters.isPending ? "opacity-50" : ""}`}
              aria-checked={hasChapters}
              role="switch"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${
                  hasChapters ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Flatten confirmation modal */}
      {showFlattenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-lg border border-white/10 bg-gray-900 p-6 shadow-xl">
            <h2 className="mb-2 text-sm font-semibold text-white">
              Remove chapters from this book?
            </h2>
            <p className="mb-4 text-[11px] text-gray-400 leading-relaxed">
              This will remove <strong className="text-white">{chapters.length} chapter{chapters.length !== 1 ? "s" : ""}</strong> and
              move <strong className="text-white">{chapterSceneCount} scene{chapterSceneCount !== 1 ? "s" : ""}</strong> to a flat list.
            </p>
            <ul className="mb-4 space-y-1 text-[11px] text-gray-400">
              <li>✓ All scene text and frontmatter is preserved</li>
              <li>✓ Scene order is preserved within each chapter</li>
              <li>⚠ Chapter titles and descriptions will be deleted</li>
              <li>⚠ Chapters are not restored automatically if you re-enable this setting</li>
            </ul>
            <div className="flex gap-3">
              <Button
                variant="destructive"
                onClick={handleConfirmFlatten}
                disabled={toggleChapters.isPending}
              >
                {toggleChapters.isPending ? <Spinner /> : null}
                Yes, remove chapters
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowFlattenModal(false)}
                disabled={toggleChapters.isPending}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

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
