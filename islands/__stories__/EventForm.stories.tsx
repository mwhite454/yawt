import EventForm from "../EventForm.tsx";
import type { Character, Location, Scene } from "@utils/story/types.ts";

const mockCharacters: Character[] = [
  {
    id: "char-1",
    userId: 12345,
    seriesId: "series-1",
    name: "Frodo Baggins",
    description: "A hobbit from the Shire",
    typeData: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "char-2",
    userId: 12345,
    seriesId: "series-1",
    name: "Gandalf",
    description: "A wizard",
    typeData: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

const mockLocations: Location[] = [
  {
    id: "loc-1",
    userId: 12345,
    seriesId: "series-1",
    name: "The Shire",
    description: "Home of the hobbits",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "loc-2",
    userId: 12345,
    seriesId: "series-1",
    name: "Rivendell",
    description: "Elven outpost",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

const mockScenes: Array<Scene & { bookTitle?: string }> = [
  {
    id: "scene-1",
    userId: 12345,
    seriesId: "series-1",
    bookId: "book-1",
    rank: "1.0",
    title: "A Long-Expected Party",
    text: "When Mr. Bilbo Baggins...",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    bookTitle: "The Fellowship of the Ring",
  },
  {
    id: "scene-2",
    userId: 12345,
    seriesId: "series-1",
    bookId: "book-1",
    rank: "2.0",
    title: "The Shadow of the Past",
    text: "The talk did not die down...",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    bookTitle: "The Fellowship of the Ring",
  },
];

export const FullForm = () => (
  <div class="p-4">
    <EventForm
      seriesId="series-1"
      characters={mockCharacters}
      locations={mockLocations}
      scenes={mockScenes}
    />
  </div>
);

export const NoCharacters = () => (
  <div class="p-4">
    <EventForm
      seriesId="series-1"
      characters={[]}
      locations={mockLocations}
      scenes={mockScenes}
    />
  </div>
);

export const NoLocations = () => (
  <div class="p-4">
    <EventForm
      seriesId="series-1"
      characters={mockCharacters}
      locations={[]}
      scenes={mockScenes}
    />
  </div>
);

export const EmptyForm = () => (
  <div class="p-4">
    <EventForm seriesId="series-1" characters={[]} locations={[]} scenes={[]} />
  </div>
);
