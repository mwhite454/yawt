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

// Union type for items in the unified list
type ListItem = 
  | { type: 'scene'; scene: SceneItem }
  | { type: 'chapter'; chapter: ChapterItem; scenes: SceneItem[] };

export default function HierarchicalSceneList({
  seriesId,
  bookId,
  bookLevelScenes: initialBookLevelScenes,
  chapters: initialChapters,
  selectedSceneId,
  selectedChapterId,
}: Props) {
  // Create unified list combining chapters and book-level scenes, sorted by rank
  const unifiedList: ListItem[] = [];
  
  // Add all book-level scenes
  initialBookLevelScenes.forEach(scene => {
    unifiedList.push({ type: 'scene', scene });
  });
  
  // Add all chapters
  initialChapters.forEach(({ chapter, scenes }) => {
    unifiedList.push({ type: 'chapter', chapter, scenes });
  });
  
  // Sort by rank to get the correct reading order
  unifiedList.sort((a, b) => {
    const rankA = a.type === 'scene' ? a.scene.rank : a.chapter.rank;
    const rankB = b.type === 'scene' ? b.scene.rank : b.chapter.rank;
    return rankA.localeCompare(rankB);
  });

  const [draggedScene, setDraggedScene] = useState<SceneItem | null>(null);
  const [dropTarget, setDropTarget] = useState<{
    chapterId: string | null;
    position: number;
  } | null>(null);

  const handleDragStart = useCallback(
    (scene: SceneItem) => {
      setDraggedScene(scene);
    },
    [],
  );

  const handleDragEnd = useCallback(() => {
    setDraggedScene(null);
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

      // Filter out the dragged scene from the target scenes to avoid self-references
      const filteredScenes = targetScenes.filter((s) => s.id !== draggedScene.id);

      // If dropping in the same chapter
      if (draggedScene.chapterId === newChapterId) {
        // Find the current position of the dragged scene in the original list
        const currentIndex = targetScenes.findIndex((s) => s.id === draggedScene.id);
        
        // If dropping at the same position or immediately after current position, do nothing
        if (currentIndex === targetPosition || currentIndex + 1 === targetPosition) {
          handleDragEnd();
          return;
        }
        
        // If dropping at the end and already the last item, do nothing
        if (targetPosition >= filteredScenes.length && currentIndex === targetScenes.length - 1) {
          handleDragEnd();
          return;
        }
      }

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
        // Dropping in the middle - send both before and after for precise positioning
        const afterScene = filteredScenes[targetPosition - 1];
        const beforeScene = filteredScenes[targetPosition];
        if (afterScene) body.afterSceneId = afterScene.id;
        if (beforeScene) body.beforeSceneId = beforeScene.id;
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

  const renderSceneItem = useCallback(
    (scene: SceneItem, chapterId: string | null, index: number, isNested: boolean) => {
      const isBeingDragged = draggedScene?.id === scene.id;
      const isDropTarget = dropTarget?.chapterId === chapterId &&
        dropTarget.position === index;
      const isActive = selectedSceneId === scene.id;

      return (
        <li
          key={scene.id}
          class={`relative transition-all duration-150 ${
            isBeingDragged ? "opacity-50" : ""
          } ${isDropTarget ? "border-t-2 border-primary" : ""} ${
            isNested ? "ml-6" : ""
          }`}
          draggable
          onDragStart={(e) => {
            e.dataTransfer!.effectAllowed = "move";
            handleDragStart(scene);
          }}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer!.dropEffect = "move";
            setDropTarget({ chapterId, position: index });
          }}
          onDrop={(e) => {
            e.preventDefault();
            // Get the scenes for this chapter/book-level
            const scenes = chapterId 
              ? initialChapters.find(c => c.chapter.id === chapterId)?.scenes ?? []
              : initialBookLevelScenes;
            handleDrop(chapterId, index, scenes);
          }}
        >
          <a
            href={`/series/${seriesId}/books/${bookId}?scene=${scene.id}${
              chapterId ? `&chapter=${chapterId}` : ""
            }`}
            class={`flex items-center gap-2 w-full px-4 py-2 hover:bg-base-200 rounded ${
              isActive ? "bg-base-300 font-semibold" : ""
            }`}
          >
            <span class="opacity-40" aria-hidden="true">⋮⋮</span>
            <span class="flex-1">{scene.title}</span>
          </a>
        </li>
      );
    },
    [
      draggedScene,
      dropTarget,
      selectedSceneId,
      seriesId,
      bookId,
      initialChapters,
      initialBookLevelScenes,
      handleDragStart,
      handleDragEnd,
      handleDrop,
    ],
  );

  return (
    <div class="space-y-1">
      <ul class="menu p-0">
        {unifiedList.map((item, idx) => {
          if (item.type === 'scene') {
            // Book-level scene
            return renderSceneItem(item.scene, null, idx, false);
          } else {
            // Chapter with its scenes
            const isExpanded = item.scenes.some((s) => s.id === selectedSceneId) ||
              selectedChapterId === item.chapter.id;
            
            return (
              <li key={item.chapter.id}>
                <details open={isExpanded}>
                  <summary class="font-semibold bg-base-200">
                    <span class="flex items-center justify-between w-full">
                      <span>{item.chapter.title}</span>
                      <span class="badge badge-sm badge-ghost">{item.scenes.length}</span>
                    </span>
                  </summary>
                  <ul class="p-0 space-y-1">
                    {item.scenes.map((scene, sceneIdx) => 
                      renderSceneItem(scene, item.chapter.id, sceneIdx, true)
                    )}
                    {/* Drop zone at the end of chapter scenes */}
                    <li
                      class={`h-8 ml-6 transition-all duration-150 ${
                        dropTarget?.chapterId === item.chapter.id &&
                          dropTarget.position === item.scenes.length
                          ? "border-t-2 border-primary bg-base-300"
                          : ""
                      }`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer!.dropEffect = "move";
                        setDropTarget({ chapterId: item.chapter.id, position: item.scenes.length });
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleDrop(item.chapter.id, item.scenes.length, item.scenes);
                      }}
                    >
                      {dropTarget?.chapterId === item.chapter.id &&
                          dropTarget.position === item.scenes.length
                        ? <div class="text-xs opacity-50 p-2">Drop here</div>
                        : <div class="h-full"></div>}
                    </li>
                    {/* Add scene to chapter form */}
                    {item.scenes.length === 0 && (
                      <li class="ml-6">
                        <div class="text-xs opacity-50 p-2">
                          No scenes in this chapter. Drag scenes here or add new.
                        </div>
                      </li>
                    )}
                    <li class="ml-6">
                      <form method="POST" class="p-2">
                        <input type="hidden" name="action" value="createScene" />
                        <input type="hidden" name="chapterId" value={item.chapter.id} />
                        <div class="flex gap-2">
                          <input
                            class="input input-bordered input-xs flex-1"
                            name="title"
                            placeholder="New scene in chapter"
                            required
                          />
                          <button class="btn btn-xs btn-ghost" type="submit">+</button>
                        </div>
                      </form>
                    </li>
                  </ul>
                </details>
              </li>
            );
          }
        })}
      </ul>
    </div>
  );
}
