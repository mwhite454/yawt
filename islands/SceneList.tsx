import DraggableList from "@islands/DraggableList.tsx";

interface SceneListItem {
  id: string;
  title: string;
  rank: string;
}

interface Props {
  seriesId: string;
  bookId: string;
  scenes: SceneListItem[];
  selectedSceneId: string | null;
}

export default function SceneList({
  seriesId,
  bookId,
  scenes: initialScenes,
  selectedSceneId,
}: Props) {
  // Track scenes locally so we can update after successful reorder
  const scenes = initialScenes;

  const handleReorder = async (reorderedScenes: SceneListItem[]) => {
    // Find which scene moved and where
    const originalIndex = scenes.findIndex((s, i) =>
      s.id !== reorderedScenes[i]?.id
    );
    if (originalIndex === -1) return;

    const movedScene = scenes[originalIndex];
    const newIndex = reorderedScenes.findIndex((s) => s.id === movedScene.id);

    // Determine before/after scene for the API
    let body: { beforeSceneId?: string; afterSceneId?: string };

    if (newIndex === 0) {
      // Moving to the beginning - use beforeSceneId of the first item
      body = { beforeSceneId: reorderedScenes[1]?.id };
    } else {
      // Moving after another item
      body = { afterSceneId: reorderedScenes[newIndex - 1]?.id };
    }

    const response = await fetch(
      `/api/series/${seriesId}/books/${bookId}/scenes/${movedScene.id}/reorder`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(body),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Reorder failed: ${errorText}`);
    }

    // Reload the page to reflect the new order
    globalThis.location.reload();
  };

  const handleError = (error: Error) => {
    console.error("Scene reorder error:", error);
    // Future: integrate with toast system
  };

  return (
    <DraggableList
      items={scenes}
      onChange={handleReorder}
      onError={handleError}
      activeId={selectedSceneId ?? undefined}
      itemHref={(scene) =>
        `/series/${seriesId}/books/${bookId}?scene=${scene.id}`}
    />
  );
}
