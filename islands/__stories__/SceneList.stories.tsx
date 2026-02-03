import SceneList from "../SceneList.tsx";

const mockScenes = [
  {
    id: "scene-1",
    title: "Prologue: Concerning Hobbits",
    rank: "1.0",
  },
  {
    id: "scene-2",
    title: "Chapter 1: A Long-Expected Party",
    rank: "2.0",
  },
  {
    id: "scene-3",
    title: "Chapter 2: The Shadow of the Past",
    rank: "3.0",
  },
  {
    id: "scene-4",
    title: "Chapter 3: Three is Company",
    rank: "4.0",
  },
];

export const BasicList = () => (
  <div class="p-4">
    <SceneList
      seriesId="series-1"
      bookId="book-1"
      scenes={mockScenes}
      selectedSceneId={null}
    />
  </div>
);

export const WithSelectedScene = () => (
  <div class="p-4">
    <SceneList
      seriesId="series-1"
      bookId="book-1"
      scenes={mockScenes}
      selectedSceneId="scene-2"
    />
  </div>
);

export const SingleScene = () => (
  <div class="p-4">
    <SceneList
      seriesId="series-1"
      bookId="book-1"
      scenes={[mockScenes[0]]}
      selectedSceneId={null}
    />
  </div>
);

export const EmptyList = () => (
  <div class="p-4">
    <SceneList
      seriesId="series-1"
      bookId="book-1"
      scenes={[]}
      selectedSceneId={null}
    />
  </div>
);
