import { useState } from "react";
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
import { ChevronDown, ChevronRight, GripVertical } from "lucide-react";
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
  hasChapters: boolean;
  focusMode: boolean;
  activeSceneId?: string;
  onReorder: (items: BookItem[]) => void;
  onCreateChapter: (title: string) => void;
  onCreateScene: (chapterId?: string) => void;
  onSelectScene: (scene: Scene) => void;
  onEditChapter: (chapter: Chapter) => void;
  onDeleteChapter: (chapterId: string) => void;
  onDeleteScene: (sceneId: string) => void;
}

// ── Sortable chapter row ──────────────────────────────────────────────────────

function ChapterRow({
  chapter,
  index,
  scenes,
  activeSceneId,
  onSelect,
  onEdit,
  onDelete,
  onCreateScene,
  onDeleteScene,
}: {
  chapter: Chapter;
  index: number;
  scenes: Scene[];
  activeSceneId?: string;
  onSelect: (s: Scene) => void;
  onEdit: () => void;
  onDelete: () => void;
  onCreateScene: () => void;
  onDeleteScene: (id: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: `chapter:${chapter.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div className="group flex items-center gap-1 rounded px-1 py-1 hover:bg-white/5">
        <span
          {...attributes}
          {...listeners}
          className="cursor-grab text-gray-600 hover:text-gray-400 active:cursor-grabbing"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </span>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex flex-1 items-center gap-1 text-left"
        >
          {open ? (
            <ChevronDown className="h-3 w-3 flex-shrink-0 text-gray-500" />
          ) : (
            <ChevronRight className="h-3 w-3 flex-shrink-0 text-gray-500" />
          )}
          <span className="truncate text-[11px] font-semibold text-gray-200">
            {chapter.title}
          </span>
          {!open && (
            <span className="ml-auto text-[10px] text-gray-600">
              {scenes.length}
            </span>
          )}
        </button>
      </div>

      {open && (
        <div className="ml-5 border-l border-white/5 pl-2">
          <SortableContext
            items={scenes.map((s) => `scene:${s.id}`)}
            strategy={verticalListSortingStrategy}
          >
            {scenes.map((scene) => (
              <SceneRow
                key={scene.id}
                scene={scene}
                isActive={scene.id === activeSceneId}
                onSelect={() => onSelect(scene)}
                onDelete={() => onDeleteScene(scene.id)}
              />
            ))}
          </SortableContext>
          <button
            type="button"
            onClick={onCreateScene}
            className="mt-1 w-full rounded border border-dashed border-white/10 py-1 text-center text-[10px] text-gray-600 transition-colors hover:border-white/20 hover:text-gray-400"
          >
            + scene
          </button>
        </div>
      )}
    </div>
  );
}

// ── Sortable scene row ────────────────────────────────────────────────────────

function SceneRow({
  scene,
  isActive,
  onSelect,
  onDelete,
}: {
  scene: Scene;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: `scene:${scene.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const title = scene.derived?.title ?? "Untitled scene";

  return (
    <div ref={setNodeRef} style={style} className="group flex items-center gap-1">
      <span
        {...attributes}
        {...listeners}
        className="cursor-grab text-gray-700 hover:text-gray-500 active:cursor-grabbing"
      >
        <GripVertical className="h-3 w-3" />
      </span>
      <button
        type="button"
        onClick={onSelect}
        className={`flex-1 truncate rounded px-2 py-1 text-left text-[11px] transition-colors ${
          isActive
            ? "bg-indigo-500/20 text-indigo-300"
            : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
        }`}
      >
        {title}
      </button>
    </div>
  );
}

// ── Focus mode strip ──────────────────────────────────────────────────────────

function FocusStrip({
  chapters,
  scenes,
  hasChapters,
  activeSceneId,
  onExpand,
}: {
  chapters: Chapter[];
  scenes: Scene[];
  hasChapters: boolean;
  activeSceneId?: string;
  onExpand: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  const activeChapterIndex = hasChapters
    ? chapters.findIndex((ch) =>
        scenes.some((s) => s.id === activeSceneId && s.chapterId === ch.id)
      )
    : -1;

  return (
    <div
      className="relative flex h-full flex-col items-center gap-2 py-3"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {hovered && (
        <button
          type="button"
          onClick={onExpand}
          className="absolute inset-0 z-10 cursor-pointer"
          aria-label="Return to navigation"
        />
      )}
      {hasChapters
        ? chapters.map((ch, i) => (
            <div
              key={ch.id}
              className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded text-[10px] font-semibold transition-opacity ${
                i === activeChapterIndex
                  ? "bg-indigo-500/30 text-indigo-300 opacity-100"
                  : "bg-white/5 text-gray-600 opacity-40"
              }`}
            >
              {i + 1}
            </div>
          ))
        : scenes.map((s, i) => (
            <div
              key={s.id}
              className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-[9px] transition-opacity ${
                s.id === activeSceneId
                  ? "bg-indigo-500/30 text-indigo-300 opacity-100"
                  : "bg-white/5 text-gray-600 opacity-30"
              }`}
            >
              {i + 1}
            </div>
          ))}
      <div
        className="mt-auto text-[8px] uppercase tracking-widest text-gray-700 opacity-40"
        style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
      >
        nav
      </div>
    </div>
  );
}

// ── New chapter form ──────────────────────────────────────────────────────────

function NewChapterForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (title: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim()) {
          onSubmit(value.trim());
          setValue("");
        }
      }}
      className="mt-2 flex gap-1"
    >
      <Input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Chapter title"
        className="h-6 text-[11px]"
      />
      <Button type="submit" size="sm" className="h-6 px-2 text-[10px]">
        Add
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-6 px-2 text-[10px]"
        onClick={onCancel}
      >
        ✕
      </Button>
    </form>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function HierarchicalSceneList({
  seriesId,
  bookId,
  chapters,
  scenes,
  hasChapters,
  focusMode,
  activeSceneId,
  onReorder,
  onCreateChapter,
  onCreateScene,
  onSelectScene,
  onEditChapter,
  onDeleteChapter,
  onDeleteScene,
}: HierarchicalSceneListProps) {
  const [showNewChapter, setShowNewChapter] = useState(false);
  const [forcedExpanded, setForcedExpanded] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const isCollapsed = focusMode && !forcedExpanded;

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const chapterItems: BookItem[] = chapters.map((ch) => ({
      type: "chapter",
      id: ch.id,
      rank: ch.rank,
    }));
    const bookScenes = scenes.filter((s) => !s.chapterId);
    const sceneItems: BookItem[] = bookScenes.map((s) => ({
      type: "scene",
      id: s.id,
      rank: s.rank,
    }));

    const allItems = hasChapters ? chapterItems : sceneItems;
    const oldIndex = allItems.findIndex((item) => `${item.type}:${item.id}` === activeId);
    const newIndex = allItems.findIndex((item) => `${item.type}:${item.id}` === overId);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...allItems];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    const prevRank = newIndex > 0 ? reordered[newIndex - 1].rank : undefined;
    const nextRank = newIndex < reordered.length - 1 ? reordered[newIndex + 1].rank : undefined;
    moved.rank = rankBetween(prevRank ?? null, nextRank ?? null);

    onReorder(reordered);
  }

  if (isCollapsed) {
    return (
      <div
        className="flex h-full w-11 flex-col overflow-hidden border-r border-white/5 bg-[#141420] transition-all duration-200"
        style={{ scrollbarWidth: "none" }}
      >
        <FocusStrip
          chapters={chapters}
          scenes={scenes}
          hasChapters={hasChapters}
          activeSceneId={activeSceneId}
          onExpand={() => setForcedExpanded(true)}
        />
      </div>
    );
  }

  return (
    <div
      className="flex h-full w-56 flex-col overflow-y-auto border-r border-white/5 bg-[#161625] transition-all duration-200"
      style={{ scrollbarWidth: "thin", scrollbarColor: "#2a2a4a transparent" }}
      onMouseLeave={() => {
        if (focusMode) setForcedExpanded(false);
      }}
    >
      <div className="flex-1 p-2">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          {hasChapters ? (
            <SortableContext
              items={chapters.map((ch) => `chapter:${ch.id}`)}
              strategy={verticalListSortingStrategy}
            >
              {chapters.map((chapter, index) => {
                const chapterScenes = scenes
                  .filter((s) => s.chapterId === chapter.id)
                  .sort((a, b) => (a.rank < b.rank ? -1 : 1));
                return (
                  <ChapterRow
                    key={chapter.id}
                    chapter={chapter}
                    index={index}
                    scenes={chapterScenes}
                    activeSceneId={activeSceneId}
                    onSelect={onSelectScene}
                    onEdit={() => onEditChapter(chapter)}
                    onDelete={() => onDeleteChapter(chapter.id)}
                    onCreateScene={() => onCreateScene(chapter.id)}
                    onDeleteScene={onDeleteScene}
                  />
                );
              })}
            </SortableContext>
          ) : (
            <SortableContext
              items={scenes.map((s) => `scene:${s.id}`)}
              strategy={verticalListSortingStrategy}
            >
              {scenes
                .filter((s) => !s.chapterId)
                .sort((a, b) => (a.rank < b.rank ? -1 : 1))
                .map((scene) => (
                  <SceneRow
                    key={scene.id}
                    scene={scene}
                    isActive={scene.id === activeSceneId}
                    onSelect={() => onSelectScene(scene)}
                    onDelete={() => onDeleteScene(scene.id)}
                  />
                ))}
            </SortableContext>
          )}
        </DndContext>

        {hasChapters && (
          <>
            {showNewChapter ? (
              <NewChapterForm
                onSubmit={(title) => {
                  onCreateChapter(title);
                  setShowNewChapter(false);
                }}
                onCancel={() => setShowNewChapter(false)}
              />
            ) : (
              <button
                type="button"
                onClick={() => setShowNewChapter(true)}
                className="mt-2 w-full rounded border border-dashed border-white/10 py-1 text-center text-[10px] text-gray-600 transition-colors hover:border-white/20 hover:text-gray-400"
              >
                + chapter
              </button>
            )}
          </>
        )}

        {!hasChapters && (
          <button
            type="button"
            onClick={() => onCreateScene(undefined)}
            className="mt-2 w-full rounded border border-dashed border-white/10 py-1 text-center text-[10px] text-gray-600 transition-colors hover:border-white/20 hover:text-gray-400"
          >
            + scene
          </button>
        )}
      </div>
    </div>
  );
}
