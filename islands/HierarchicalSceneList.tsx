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
}

export default function HierarchicalSceneList({
  seriesId,
  bookId,
  bookLevelScenes: initialBookLevelScenes,
  chapters: initialChapters,
  selectedSceneId,
}: Props) {
  const [draggedScene, setDraggedScene] = useState<SceneItem | null>(null);
  const [draggedFromChapter, setDraggedFromChapter] = useState<string | null>(
    null,
  );
  const [dropTarget, setDropTarget] = useState<{
    chapterId: string | null;
    position: number;
  } | null>(null);

  const handleDragStart = useCallback(
    (scene: SceneItem, fromChapterId: string | null) => {
      setDraggedScene(scene);
      setDraggedFromChapter(fromChapterId);
    },
    [],
  );

  const handleDragEnd = useCallback(() => {
    setDraggedScene(null);
    setDraggedFromChapter(null);
    setDropTarget(null);
  }, []);

  const handleDrop = useCallback(
    async (
      targetChapterId: string | null,
      targetPosition: number,
      targetScenes: SceneItem[],
    ) => {
      if (!draggedScene) return;

      // Determine the new chapterId
      const newChapterId = targetChapterId ?? undefined;

      // If dropping in the same position within the same chapter, do nothing
      if (
        draggedScene.chapterId === newChapterId &&
        targetScenes[targetPosition]?.id === draggedScene.id
      ) {
        handleDragEnd();
        return;
      }

      // Filter out the dragged scene from the target scenes to avoid self-references
      const filteredScenes = targetScenes.filter(s => s.id !== draggedScene.id);

      // Determine before/after scene IDs for positioning
      let body: {
        targetChapterId?: string | null;
        beforeSceneId?: string;
        afterSceneId?: string;
      } = {
        targetChapterId: targetChapterId,
      };

      if (filteredScenes.length === 0) {
        // Dropping into an empty list (or list with only the dragged scene)
        // No positioning needed - will append to end
      } else if (targetPosition === 0) {
        // Dropping at the beginning
        body.beforeSceneId = filteredScenes[0]?.id;
      } else if (targetPosition >= filteredScenes.length) {
        // Dropping at the end
        body.afterSceneId = filteredScenes[filteredScenes.length - 1]?.id;
      } else {
        // Dropping in the middle
        body.afterSceneId = filteredScenes[targetPosition - 1]?.id;
      }

      try {
        const response = await fetch(
          `/api/series/${seriesId}/books/${bookId}/scenes/${draggedScene.id}/move`,
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

        // Reload the page to reflect changes
        globalThis.location.reload();
      } catch (error) {
        console.error("Scene move error:", error);
        handleDragEnd();
      }
    },
    [draggedScene, seriesId, bookId, handleDragEnd],
  );

  const renderSceneList = useCallback(
    (scenes: SceneItem[], chapterId: string | null, label: string) => {
      return (
        <div>
          <div class="font-semibold text-sm mb-2 opacity-70">{label}</div>
          <ul class="menu bg-base-200 rounded-box">
            {scenes.map((scene, index) => {
              const isBeingDragged = draggedScene?.id === scene.id;
              const isDropTarget = dropTarget?.chapterId === chapterId &&
                dropTarget.position === index;
              const isActive = selectedSceneId === scene.id;

              return (
                <li
                  key={scene.id}
                  class={`relative transition-all duration-150 ${
                    isBeingDragged ? "opacity-50" : ""
                  } ${isDropTarget ? "border-t-2 border-primary" : ""}`}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer!.effectAllowed = "move";
                    handleDragStart(scene, chapterId);
                  }}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer!.dropEffect = "move";
                    setDropTarget({ chapterId, position: index });
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleDrop(chapterId, index, scenes);
                  }}
                >
                  <a
                    href={`/series/${seriesId}/books/${bookId}?scene=${scene.id}${
                      chapterId ? `&chapter=${chapterId}` : ""
                    }`}
                    class={isActive ? "active" : ""}
                  >
                    <span class="flex items-center gap-2 w-full">
                      <span class="opacity-40" aria-hidden="true">⋮⋮</span>
                      <span class="flex-1">{scene.title}</span>
                    </span>
                  </a>
                </li>
              );
            })}
            {/* Drop zone at the end of the list */}
            <li
              class={`h-8 transition-all duration-150 ${
                dropTarget?.chapterId === chapterId &&
                  dropTarget.position === scenes.length
                  ? "border-t-2 border-primary bg-base-300"
                  : ""
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer!.dropEffect = "move";
                setDropTarget({ chapterId, position: scenes.length });
              }}
              onDrop={(e) => {
                e.preventDefault();
                handleDrop(chapterId, scenes.length, scenes);
              }}
            >
              {dropTarget?.chapterId === chapterId &&
                  dropTarget.position === scenes.length
                ? <div class="text-xs opacity-50 p-2">Drop here</div>
                : <div class="h-full"></div>}
            </li>
          </ul>
        </div>
      );
    },
    [
      draggedScene,
      dropTarget,
      selectedSceneId,
      seriesId,
      bookId,
      handleDragStart,
      handleDragEnd,
      handleDrop,
    ],
  );

  return (
    <div class="space-y-3">
      {/* Book-level scenes */}
      {initialBookLevelScenes.length > 0 &&
        renderSceneList(initialBookLevelScenes, null, "Book-level Scenes")}

      {/* Chapters and their scenes */}
      {initialChapters.map(({ chapter, scenes }) => {
        const isExpanded = scenes.some((s) => s.id === selectedSceneId);
        return (
          <div
            key={chapter.id}
            class="collapse collapse-arrow border border-base-300"
          >
            <input
              type="checkbox"
              aria-label={`Toggle ${chapter.title}`}
              defaultChecked={isExpanded}
            />
            <div class="collapse-title font-medium">
              <div class="flex items-center justify-between">
                <span>{chapter.title}</span>
                <span class="badge badge-sm">{scenes.length}</span>
              </div>
            </div>
            <div class="collapse-content">
              <div class="mt-2 space-y-2">
                {/* Add scene to chapter button */}
                <form method="POST">
                  <input type="hidden" name="action" value="createScene" />
                  <input
                    type="hidden"
                    name="chapterId"
                    value={chapter.id}
                  />
                  <div class="flex gap-2">
                    <input
                      class="input input-bordered input-xs flex-1"
                      name="title"
                      placeholder="New scene"
                      required
                    />
                    <button class="btn btn-xs" type="submit">
                      +
                    </button>
                  </div>
                </form>

                {scenes.length === 0
                  ? (
                    <div class="text-sm opacity-50">
                      No scenes in this chapter. Drag scenes here.
                    </div>
                  )
                  : renderSceneList(scenes, chapter.id, "")}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
