import { useState } from "react";
import { ChevronLeft, Settings2 } from "lucide-react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useBookQuery } from "@/hooks/use-books";
import {
  useChaptersQuery,
  useScenesQuery,
  useCreateChapterMutation,
  useUpdateChapterMutation,
  useCreateSceneMutation,
  useUpdateSceneMutation,
  useDeleteSceneMutation,
  useDeleteChapterMutation,
  useReorderItemsMutation,
} from "@/hooks/use-book-content";
import { HierarchicalSceneList } from "@/components/HierarchicalSceneList";
import type { Scene, Chapter } from "@/types/story";
import { ApiError } from "@/lib/api";

type EditingScene = Scene & { _isNew?: boolean };

export function BookDetailPage() {
  const { seriesId = "", bookId = "" } = useParams<{
    seriesId: string;
    bookId: string;
  }>();

  const { data: book } = useBookQuery(seriesId, bookId);
  const { data: chapters = [] } = useChaptersQuery(seriesId, bookId);
  const { data: scenes = [], isLoading } = useScenesQuery(seriesId, bookId);

  const createChapter = useCreateChapterMutation(seriesId, bookId);
  const updateChapter = useUpdateChapterMutation(seriesId, bookId);
  const deleteChapter = useDeleteChapterMutation(seriesId, bookId);
  const createScene = useCreateSceneMutation(seriesId, bookId);
  const updateScene = useUpdateSceneMutation(seriesId, bookId);
  const deleteScene = useDeleteSceneMutation(seriesId, bookId);
  const reorder = useReorderItemsMutation(seriesId, bookId);

  const [editingScene, setEditingScene] = useState<EditingScene | null>(null);
  const [sceneText, setSceneText] = useState("");
  const [sceneTitle, setSceneTitle] = useState("");
  const [focusMode, setFocusMode] = useState(false);
  const [activeSceneId, setActiveSceneId] = useState<string | undefined>();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [chapterTitle, setChapterTitle] = useState("");

  function showError(msg: string) {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 4000);
  }

  function openNewScene(chapterId?: string) {
    setEditingScene({
      id: "",
      userId: 0,
      seriesId,
      bookId,
      chapterId,
      rank: "",
      text: "",
      derived: {},
      createdAt: 0,
      updatedAt: 0,
      _isNew: true,
    } as EditingScene);
    setSceneText("");
    setSceneTitle("");
  }

  async function handleSaveScene(e: React.FormEvent) {
    e.preventDefault();
    if (!editingScene) return;
    try {
      if (editingScene._isNew) {
        const text = sceneTitle.trim()
          ? `---\ntitle: ${sceneTitle.trim()}\n---\n\n${sceneText}`
          : sceneText;
        await createScene.mutateAsync({
          text,
          chapterId: editingScene.chapterId,
        });
      } else {
        await updateScene.mutateAsync({
          sceneId: editingScene.id,
          data: { text: sceneText },
        });
      }
      setEditingScene(null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        showError("Book-level scenes are disabled. Add scenes inside a chapter.");
      } else {
        throw err;
      }
    }
  }

  function openEditScene(scene: Scene) {
    setEditingScene(scene as EditingScene);
    setSceneText(scene.text);
    setActiveSceneId(scene.id);
  }

  function openEditChapter(chapter: Chapter) {
    setEditingChapter(chapter);
    setChapterTitle(chapter.title);
  }

  async function handleSaveChapter(e: React.FormEvent) {
    e.preventDefault();
    if (!editingChapter) return;
    await updateChapter.mutateAsync({
      chapterId: editingChapter.id,
      data: { title: chapterTitle },
    });
    setEditingChapter(null);
  }

  return (
    <div className="space-y-4">
      <div className={`flex items-end justify-between border-b border-white/10 px-1 pb-2 transition-opacity duration-200 ${focusMode ? "opacity-20" : "opacity-100"}`}>
        <div className="space-y-1">
          <Link
            to={`/series/${seriesId}`}
            className="inline-flex items-center gap-1 text-[11px] text-gray-400 transition-colors hover:text-white"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Books
          </Link>
          <div className="panel-title">Book</div>
          <h1 className="text-sm font-semibold text-white">
            {book?.title ?? "…"}
          </h1>
        </div>
        <Link
          to={`/series/${seriesId}/books/${bookId}/settings`}
          className="inline-flex items-center gap-1 text-[11px] text-gray-400 transition-colors hover:text-white"
        >
          <Settings2 className="h-3.5 w-3.5" />
          Settings
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 py-4">
          <Spinner className="h-4 w-4 text-gray-400" />
          <p className="text-xs text-gray-400">Loading book content…</p>
        </div>
      ) : (
        <HierarchicalSceneList
          seriesId={seriesId}
          bookId={bookId}
          chapters={chapters}
          scenes={scenes}
          hasChapters={book?.hasChapters !== false}
          focusMode={focusMode}
          activeSceneId={activeSceneId}
          onReorder={(items) => reorder.mutate(items)}
          onCreateChapter={(title) =>
            createChapter.mutate({ title }, {
              onError: (err) => {
                if (err instanceof ApiError && err.status === 409) {
                  showError("Chapters are disabled for this book. Enable chapters in book settings.");
                }
              },
            })
          }
          onCreateScene={openNewScene}
          onSelectScene={openEditScene}
          onDeleteScene={(id) => {
            if (confirm("Delete this scene?")) deleteScene.mutate(id);
          }}
          onEditChapter={openEditChapter}
          onDeleteChapter={(id) => {
            if (confirm("Delete this chapter?")) deleteChapter.mutate(id);
          }}
        />
      )}

      {/* Scene editor modal */}
      {editingScene && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-3xl shadow-2xl">
            <CardHeader className="border-b border-white/10">
              <CardTitle>
                {editingScene._isNew ? "New scene" : "Edit scene"}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2.5">
              <form onSubmit={handleSaveScene} className="space-y-3">
                {editingScene._isNew && (
                  <Input
                    autoFocus
                    placeholder="Scene title (optional)"
                    value={sceneTitle}
                    onChange={(e) => setSceneTitle(e.target.value)}
                  />
                )}
                <Textarea
                  autoFocus={!editingScene._isNew}
                  value={sceneText}
                  onChange={(e) => setSceneText(e.target.value)}
                  onFocus={() => setFocusMode(true)}
                  onBlur={() => setFocusMode(false)}
                  placeholder="Write your scene here... YAML frontmatter supported"
                  className="h-80 font-mono text-[11px]"
                />
                <div className="flex gap-2">
                  <Button type="submit">Save</Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingScene(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error toast */}
      {errorMessage && (
        <div className="fixed bottom-4 right-4 z-50 rounded border border-red-500/60 bg-red-600/15 px-3 py-2 text-xs text-red-300 shadow-lg">
          {errorMessage}
        </div>
      )}

      {/* Chapter editor modal */}
      {editingChapter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader className="border-b border-white/10">
              <CardTitle>Edit chapter</CardTitle>
            </CardHeader>
            <CardContent className="pt-2.5">
              <form onSubmit={handleSaveChapter} className="space-y-3">
                <Input
                  autoFocus
                  value={chapterTitle}
                  onChange={(e) => setChapterTitle(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button type="submit">Save</Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingChapter(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
