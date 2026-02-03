import DraggableList from "../DraggableList.tsx";

const mockBooks = [
  { id: "book-1", title: "The Fellowship of the Ring" },
  { id: "book-2", title: "The Two Towers" },
  { id: "book-3", title: "The Return of the King" },
];

const mockScenes = [
  { id: "scene-1", title: "Prologue: Concerning Hobbits" },
  { id: "scene-2", title: "Chapter 1: A Long-Expected Party" },
  { id: "scene-3", title: "Chapter 2: The Shadow of the Past" },
  { id: "scene-4", title: "Chapter 3: Three is Company" },
];

export const BasicList = () => (
  <div class="p-4">
    <DraggableList
      items={mockBooks}
      onChange={async (items) => {
        console.log("Reordered items:", items);
      }}
    />
  </div>
);

export const LongerList = () => (
  <div class="p-4">
    <DraggableList
      items={mockScenes}
      onChange={async (items) => {
        console.log("Reordered items:", items);
      }}
    />
  </div>
);

export const WithActiveItem = () => (
  <div class="p-4">
    <DraggableList
      items={mockBooks}
      activeId="book-2"
      onChange={async (items) => {
        console.log("Reordered items:", items);
      }}
    />
  </div>
);

export const WithLinks = () => (
  <div class="p-4">
    <DraggableList
      items={mockBooks}
      itemHref={(item) => `/book/${item.id}`}
      onChange={async (items) => {
        console.log("Reordered items:", items);
      }}
    />
  </div>
);

export const Disabled = () => (
  <div class="p-4">
    <DraggableList
      items={mockBooks}
      disabled={true}
      onChange={async (items) => {
        console.log("Reordered items:", items);
      }}
    />
  </div>
);

export const WithCustomRender = () => (
  <div class="p-4">
    <DraggableList
      items={mockBooks}
      renderItem={(item, index) => (
        <span>
          <strong>{index + 1}.</strong> {item.title}
        </span>
      )}
      onChange={async (items) => {
        console.log("Reordered items:", items);
      }}
    />
  </div>
);
