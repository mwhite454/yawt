import { useCallback, useState } from "preact/hooks";

interface SceneItem {
  id: string;
  title: string;
  rank: string;
  chapterId?: string;
}

interface ChapterItem {
  id: string;
  title: string;
  rank: string;
}

interface Props {
  seriesId: string;
  bookId: string;
  bookLevelScenes: SceneItem[];
  chapters: Array<{
    chapter: ChapterItem;
    scenes: SceneItem[];
  }>;
  selectedSceneId: string | null;
  selectedChapterId: string | null;
}

// Union type for items in the unified list (book-level items only)
type BookLevelItem =
  | { type: "scene"; item: SceneItem }
  | { type: "chapter"; item: ChapterItem; scenes: SceneItem[] };

export default function HierarchicalSceneList({
  seriesId,
  bookId,
  bookLevelScenes: initialBookLevelScenes,
  chapters: initialChapters,
  selectedSceneId,
  selectedChapterId,
}: Props) {
  // Create unified list of book-level items (chapters and book-level scenes)
  const bookLevelItems: BookLevelItem[] = [];

  initialBookLevelScenes.forEach((scene) => {
    bookLevelItems.push({ type: "scene", item: scene });
  });

  initialChapters.forEach(({ chapter, scenes }) => {
    bookLevelItems.push({ type: "chapter", item: chapter, scenes });
  });

  // Sort by rank
  bookLevelItems.sort((a, b) => {
    const rankA = a.item.rank;
    const rankB = b.item.rank;
    if (rankA < rankB) return -1;
    if (rankA > rankB) return 1;
    return 0;
  });

  // Drag state
  const [draggedItem, setDraggedItem] = useState<BookLevelItem | null>(null);
  const [draggedChapterScene, setDraggedChapterScene] = useState<
    {
      scene: SceneItem;
      chapterId: string;
    } | null
  >(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const [sceneDropTarget, setSceneDropTarget] = useState<
    {
      chapterId: string | null;
      position: number;
    } | null
  >(null);

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
    setDraggedChapterScene(null);
    setDropTargetIndex(null);
    setSceneDropTarget(null);
  }, []);

  // Handle reordering book-level items (chapters and book-level scenes)
  const handleBookLevelReorder = useCallback(
    async (targetIndex: number) => {
      if (!draggedItem) return;

      const itemsBefore = bookLevelItems
        .slice(0, targetIndex)
        .filter((i) => i.item.id !== draggedItem.item.id);
      const itemsAfter = bookLevelItems
        .slice(targetIndex)
        .filter((i) => i.item.id !== draggedItem.item.id);

      const afterRank = itemsBefore.length > 0
        ? itemsBefore[itemsBefore.length - 1].item.rank
        : null;
      const beforeRank = itemsAfter.length > 0 ? itemsAfter[0].item.rank : null;

      // Don't reorder if we're not actually moving
      const currentIndex = bookLevelItems.findIndex(
        (i) => i.item.id === draggedItem.item.id,
      );
      if (currentIndex === targetIndex || currentIndex + 1 === targetIndex) {
        handleDragEnd();
        return;
      }

      try {
        const response = await fetch(
          `/api/series/${seriesId}/books/${bookId}/items/reorder`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({
              itemType: draggedItem.type,
              itemId: draggedItem.item.id,
              afterRank,
              beforeRank,
            }),
          },
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Reorder failed:", errorText);
          throw new Error(`Reorder failed: ${errorText}`);
        }

        globalThis.location.reload();
      } catch (error) {
        console.error("Reorder error:", error);
        handleDragEnd();
      }
    },
    [draggedItem, bookLevelItems, seriesId, bookId, handleDragEnd],
  );

  // Handle moving scenes between chapters or to/from book level
  const handleSceneMove = useCallback(
    async (
      targetChapterId: string | null,
      targetPosition: number,
      targetScenes: SceneItem[],
    ) => {
      const scene = draggedChapterScene?.scene ||
        (draggedItem?.type === "scene" ? draggedItem.item : null);

      if (!scene) return;

      const filteredScenes = targetScenes.filter((s) => s.id !== scene.id);

      const body: {
        targetChapterId: string | null;
        beforeSceneId?: string;
        afterSceneId?: string;
      } = {
        targetChapterId,
      };

      if (filteredScenes.length > 0) {
        if (targetPosition === 0) {
          body.beforeSceneId = filteredScenes[0]?.id;
        } else if (targetPosition >= filteredScenes.length) {
          body.afterSceneId = filteredScenes[filteredScenes.length - 1]?.id;
        } else {
          body.afterSceneId = filteredScenes[targetPosition - 1]?.id;
          body.beforeSceneId = filteredScenes[targetPosition]?.id;
        }
      }

      try {
        const response = await fetch(
          `/api/series/${seriesId}/books/${bookId}/scenes/${scene.id}/move`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify(body),
          },
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Move failed:", errorText);
          throw new Error(`Move failed: ${errorText}`);
        }

        globalThis.location.reload();
      } catch (error) {
        console.error("Scene move error:", error);
        handleDragEnd();
      }
    },
    [draggedChapterScene, draggedItem, seriesId, bookId, handleDragEnd],
  );

  const renderBookLevelItem = (item: BookLevelItem, index: number) => {
    const isBeingDragged = draggedItem?.item.id === item.item.id;
    const isDropTarget = dropTargetIndex === index;

    if (item.type === "scene") {
      const isActive = selectedSceneId === item.item.id;
      return (
        <li
          key={item.item.id}
          class={`relative transition-all duration-150 ${
            isBeingDragged ? "opacity-50" : ""
          } ${isDropTarget ? "border-t-2 border-primary" : ""}`}
          draggable
          onDragStart={(e) => {
            e.dataTransfer!.effectAllowed = "move";
            setDraggedItem(item);
          }}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer!.dropEffect = "move";
            setDropTargetIndex(index);
          }}
          onDrop={(e) => {
            e.preventDefault();
            handleBookLevelReorder(index);
          }}
        >
          <a
            href={`/series/${seriesId}/books/${bookId}?scene=${item.item.id}`}
            class={`flex items-center gap-2 w-full px-3 py-2 hover:bg-base-200 rounded transition-colors ${
              isActive ? "bg-primary text-primary-content font-semibold" : ""
            }`}
            aria-current={isActive ? "page" : undefined}
          >
            <span class="opacity-40 text-xs cursor-grab" aria-hidden="true">
              ⋮⋮
            </span>
            <span class="flex-1 text-sm">{item.item.title}</span>
          </a>
        </li>
      );
    } else {
      // Chapter
      const chapterScenes = item.scenes;
      const isActive = selectedChapterId === item.item.id;

      return (
        <li
          key={item.item.id}
          class={`border-l-2 border-base-300 pl-2 transition-all duration-150 ${
            isBeingDragged ? "opacity-50" : ""
          } ${isDropTarget ? "border-t-2 border-primary" : ""}`}
          draggable
          onDragStart={(e) => {
            e.dataTransfer!.effectAllowed = "move";
            setDraggedItem(item);
          }}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer!.dropEffect = "move";
            setDropTargetIndex(index);
          }}
          onDrop={(e) => {
            e.preventDefault();
            handleBookLevelReorder(index);
          }}
        >
          <div
            class={`font-bold hover:bg-base-300 cursor-grab px-3 py-2 rounded ${
              isActive ? "bg-base-300" : "bg-base-200"
            }`}
          >
            <span class="flex items-center justify-between w-full">
              <span class="flex items-center gap-2 text-sm">
                <span class="opacity-40 text-xs" aria-hidden="true">
                  ⋮⋮
                </span>
                {item.item.title}
              </span>
              <span class="badge badge-sm badge-neutral">
                {chapterScenes.length}
              </span>
            </span>
          </div>
          <ul class="p-0 mt-1 space-y-1">
            {chapterScenes.map((scene, sceneIdx) =>
              renderChapterScene(scene, item.item.id, sceneIdx, chapterScenes)
            )}
            {/* Drop zone at end of chapter */}
            {(draggedChapterScene || draggedItem?.type === "scene") && (
              <li
                class={`h-8 ml-4 transition-all duration-150 rounded ${
                  sceneDropTarget?.chapterId === item.item.id &&
                    sceneDropTarget.position === chapterScenes.length
                    ? "border-2 border-dashed border-primary bg-primary/10"
                    : "border-2 border-dashed border-transparent"
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer!.dropEffect = "move";
                  setSceneDropTarget({
                    chapterId: item.item.id,
                    position: chapterScenes.length,
                  });
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  handleSceneMove(
                    item.item.id,
                    chapterScenes.length,
                    chapterScenes,
                  );
                }}
              >
                {sceneDropTarget?.chapterId === item.item.id &&
                  sceneDropTarget.position === chapterScenes.length && (
                  <div class="text-xs opacity-50 p-2 text-center">
                    Drop scene here
                  </div>
                )}
              </li>
            )}
            {chapterScenes.length === 0 && (
              <li class="ml-4">
                <div class="text-xs opacity-50 p-2 italic">
                  No scenes yet. Drag scenes here or create new.
                </div>
              </li>
            )}
            <li class="ml-4">
              <form method="POST" class="p-2 bg-base-100 rounded">
                <input type="hidden" name="action" value="createScene" />
                <input type="hidden" name="chapterId" value={item.item.id} />
                <div class="flex gap-2">
                  <input
                    class="input input-bordered input-xs flex-1"
                    name="title"
                    placeholder="Add new scene..."
                    required
                  />
                  <button class="btn btn-xs btn-primary" type="submit">
                    +
                  </button>
                </div>
              </form>
            </li>
          </ul>
        </li>
      );
    }
  };

  const renderChapterScene = (
    scene: SceneItem,
    chapterId: string,
    index: number,
    allScenes: SceneItem[],
  ) => {
    const isBeingDragged = draggedChapterScene?.scene.id === scene.id;
    const isDropTarget = sceneDropTarget?.chapterId === chapterId &&
      sceneDropTarget.position === index;
    const isActive = selectedSceneId === scene.id;

    return (
      <li
        key={scene.id}
        class={`relative ml-4 transition-all duration-150 ${
          isBeingDragged ? "opacity-50" : ""
        } ${isDropTarget ? "border-t-2 border-primary" : ""}`}
        draggable
        onDragStart={(e) => {
          e.dataTransfer!.effectAllowed = "move";
          setDraggedChapterScene({ scene, chapterId });
        }}
        onDragEnd={handleDragEnd}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer!.dropEffect = "move";
          setSceneDropTarget({ chapterId, position: index });
        }}
        onDrop={(e) => {
          e.preventDefault();
          handleSceneMove(chapterId, index, allScenes);
        }}
      >
        <a
          href={`/series/${seriesId}/books/${bookId}?scene=${scene.id}&chapter=${chapterId}`}
          class={`flex items-center gap-2 w-full px-3 py-2 hover:bg-base-200 rounded transition-colors ${
            isActive ? "bg-primary text-primary-content font-semibold" : ""
          }`}
          aria-current={isActive ? "page" : undefined}
        >
          <span class="opacity-40 text-xs cursor-grab" aria-hidden="true">
            ⋮⋮
          </span>
          <span class="flex-1 text-sm">{scene.title}</span>
        </a>
      </li>
    );
  };

  return (
    <div class="space-y-1">
      <ul class="menu p-0 space-y-1">
        {/* Drop zone at the very beginning */}
        {bookLevelItems.length > 0 && draggedItem && (
          <li
            class={`h-8 transition-all duration-150 rounded ${
              dropTargetIndex === 0
                ? "border-2 border-dashed border-primary bg-primary/10"
                : "border-2 border-dashed border-transparent"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer!.dropEffect = "move";
              setDropTargetIndex(0);
            }}
            onDrop={(e) => {
              e.preventDefault();
              handleBookLevelReorder(0);
            }}
          >
            {dropTargetIndex === 0 && (
              <div class="text-xs opacity-50 p-2 text-center">Drop here</div>
            )}
          </li>
        )}

        {/* Empty state drop zone for scenes being moved to book level */}
        {bookLevelItems.length === 0 &&
          (draggedChapterScene || draggedItem?.type === "scene") && (
          <li
            class={`h-12 transition-all duration-150 rounded ${
              sceneDropTarget?.chapterId === null
                ? "border-2 border-dashed border-primary bg-primary/10"
                : "border-2 border-dashed border-base-300"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer!.dropEffect = "move";
              setSceneDropTarget({ chapterId: null, position: 0 });
            }}
            onDrop={(e) => {
              e.preventDefault();
              handleSceneMove(null, 0, []);
            }}
          >
            <div class="text-xs opacity-50 p-2 text-center">
              Drop scene at book level
            </div>
          </li>
        )}

        {bookLevelItems.map((item, index) => renderBookLevelItem(item, index))}

        {/* Drop zone at the very end */}
        {bookLevelItems.length > 0 && draggedItem && (
          <li
            class={`h-8 transition-all duration-150 rounded ${
              dropTargetIndex === bookLevelItems.length
                ? "border-2 border-dashed border-primary bg-primary/10"
                : "border-2 border-dashed border-transparent"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer!.dropEffect = "move";
              setDropTargetIndex(bookLevelItems.length);
            }}
            onDrop={(e) => {
              e.preventDefault();
              handleBookLevelReorder(bookLevelItems.length);
            }}
          >
            {dropTargetIndex === bookLevelItems.length && (
              <div class="text-xs opacity-50 p-2 text-center">Drop here</div>
            )}
          </li>
        )}

        {/* Drop zone for moving chapter scenes to book level */}
        {bookLevelItems.length > 0 && draggedChapterScene && (
          <li
            class={`h-8 transition-all duration-150 rounded ${
              sceneDropTarget?.chapterId === null
                ? "border-2 border-dashed border-primary bg-primary/10"
                : "border-2 border-dashed border-secondary"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer!.dropEffect = "move";
              setSceneDropTarget({
                chapterId: null,
                position: initialBookLevelScenes.length,
              });
            }}
            onDrop={(e) => {
              e.preventDefault();
              const bookScenes = initialBookLevelScenes;
              handleSceneMove(null, bookScenes.length, bookScenes);
            }}
          >
            <div class="text-xs opacity-50 p-2 text-center">
              Move to book level
            </div>
          </li>
        )}
      </ul>
    </div>
  );
}
