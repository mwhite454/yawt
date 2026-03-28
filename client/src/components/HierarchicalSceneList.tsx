import { useState, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Chapter, Scene } from "@/types/story";
import { rankBetween } from "@/lib/rank";

interface BookItem {
  type: "chapter" | "scene";
  id: string;
  rank: string;
}

interface HierarchicalSceneListProps {
  seriesId: string;
  bookId: string;
  chapters: Chapter[];
  scenes: Scene[];
  onReorder: (items: BookItem[]) => void;
  onCreateChapter: (title: string) => void;
  onCreateScene: (chapterId?: string) => void;
  onEditScene: (scene: Scene) => void;
  onDeleteScene: (sceneId: string) => void;
  onEditChapter: (chapter: Chapter) => void;
  onDeleteChapter: (chapterId: string) => void;
}

// ── Sortable row ─────────────────────────────────────────────────────────────

function SortableChapterRow({
  chapter,
  scenes,
  onEdit,
  onDelete,
  onCreateScene,
  onEditScene,
  onDeleteScene,
}: {
  chapter: Chapter;
  scenes: Scene[];
  onEdit: () => void;
  onDelete: () => void;
  onCreateScene: () => void;
  onEditScene: (s: Scene) => void;
  onDeleteScene: (id: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: `chapter:${chapter.id}` });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <div className="flex items-center gap-2 rounded border border-white/10 bg-gray-800 px-2 py-1.5">
        <button
          {...listeners}
          {...attributes}
          className="cursor-grab touch-none text-gray-500 active:cursor-grabbing"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex-1 text-left text-[11px] font-medium text-white"
        >
          {open ? "▾" : "▸"} {chapter.title}
        </button>
        <Button size="sm" variant="ghost" onClick={onCreateScene}>
          <Plus className="h-3.5 w-3.5" />
          Scene
        </Button>
        <Button size="sm" variant="ghost" onClick={onEdit}>
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-red-400"
          onClick={() => {
            if (confirm(`Delete chapter "${chapter.title}"?`)) onDelete();
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </Button>
      </div>
      {open && (
        <div className="ml-4 mt-0.5 space-y-0.5">
          {scenes.map((scene) => (
            <SortableSceneRow
              key={scene.id}
              scene={scene}
              onEdit={() => onEditScene(scene)}
              onDelete={() => onDeleteScene(scene.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SortableSceneRow({
  scene,
  onEdit,
  onDelete,
}: {
  scene: Scene;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: `scene:${scene.id}` });

  const title =
    (scene.derived.title ?? scene.text.split("\n")[0].slice(0, 60)) ||
    "Untitled";

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="flex items-center gap-2 rounded border border-transparent px-2 py-1 hover:bg-gray-800/60"
    >
      <button
        {...listeners}
        {...attributes}
        className="cursor-grab touch-none text-gray-500 active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <span className="flex-1 truncate text-[11px] text-gray-200">{title}</span>
      <Button size="sm" variant="ghost" onClick={onEdit}>
        Edit
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="text-red-400"
        onClick={() => {
          if (confirm("Delete this scene?")) onDelete();
        }}
      >
        <Trash2 className="h-3.5 w-3.5" />
        Delete
      </Button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function HierarchicalSceneList({
  chapters,
  scenes,
  onReorder,
  onCreateChapter,
  onCreateScene,
  onEditScene,
  onDeleteScene,
  onEditChapter,
  onDeleteChapter,
}: HierarchicalSceneListProps) {
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [showNewChapter, setShowNewChapter] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Build ordered list of items (chapters and book-level scenes) sorted by rank
  const orderedItems = useMemo(() => {
    const chapterItems = chapters.map((c) => ({
      type: "chapter" as const,
      id: `chapter:${c.id}`,
      rank: c.rank,
      data: c,
    }));
    const bookScenes = scenes
      .filter((s) => !s.chapterId)
      .map((s) => ({
        type: "scene" as const,
        id: `scene:${s.id}`,
        rank: s.rank,
        data: s,
      }));
    return [...chapterItems, ...bookScenes].sort((a, b) =>
      a.rank < b.rank ? -1 : a.rank > b.rank ? 1 : 0,
    );
  }, [chapters, scenes]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = orderedItems.findIndex((i) => i.id === active.id);
    const newIndex = orderedItems.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = [...orderedItems];
    const [moved] = newOrder.splice(oldIndex, 1);
    newOrder.splice(newIndex, 0, moved);

    // Compute new ranks using fractional indexing
    const reranked = newOrder.map((item, idx) => {
      const prevRank = idx > 0 ? newOrder[idx - 1].rank : null;
      const nextRank =
        idx < newOrder.length - 1 ? newOrder[idx + 1].rank : null;
      const newRank =
        item.id === active.id ? rankBetween(prevRank, nextRank) : item.rank;
      return { ...item, rank: newRank };
    });

    const apiItems = reranked.map((item) => {
      const [type, id] = item.id.split(":");
      return { type: type as "chapter" | "scene", id, rank: item.rank };
    });

    onReorder(apiItems);
  }

  return (
    <div className="space-y-1.5">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={orderedItems.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          {orderedItems.map((item) => {
            if (item.type === "chapter") {
              const chapter = item.data as Chapter;
              return (
                <SortableChapterRow
                  key={item.id}
                  chapter={chapter}
                  scenes={scenes.filter((s) => s.chapterId === chapter.id)}
                  onEdit={() => onEditChapter(chapter)}
                  onDelete={() => onDeleteChapter(chapter.id)}
                  onCreateScene={() => onCreateScene(chapter.id)}
                  onEditScene={onEditScene}
                  onDeleteScene={onDeleteScene}
                />
              );
            }
            const scene = item.data as Scene;
            return (
              <SortableSceneRow
                key={item.id}
                scene={scene}
                onEdit={() => onEditScene(scene)}
                onDelete={() => onDeleteScene(scene.id)}
              />
            );
          })}
        </SortableContext>
      </DndContext>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button variant="outline" onClick={() => onCreateScene(undefined)}>
          <Plus className="h-3.5 w-3.5" />
          Scene
        </Button>
        <Button variant="outline" onClick={() => setShowNewChapter(true)}>
          <Plus className="h-3.5 w-3.5" />
          Chapter
        </Button>
      </div>

      {showNewChapter && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (newChapterTitle) {
              onCreateChapter(newChapterTitle);
              setNewChapterTitle("");
              setShowNewChapter(false);
            }
          }}
          className="flex gap-2 pt-1"
        >
          <Input
            autoFocus
            placeholder="Chapter title"
            value={newChapterTitle}
            onChange={(e) => setNewChapterTitle(e.target.value)}
            className="flex-1"
          />
          <Button type="submit">Add</Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowNewChapter(false)}
          >
            Cancel
          </Button>
        </form>
      )}
    </div>
  );
}
