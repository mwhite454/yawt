import { SeriesDropdown } from "../SeriesDropdown.tsx";
import type { Series } from "@utils/story/types.ts";

const mockSeries: Series[] = [
  {
    id: "series-1",
    userId: 12345,
    title: "The First Series",
    description: "A great fantasy series",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "series-2",
    userId: 12345,
    title: "Another Series",
    description: "A sci-fi adventure",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "series-3",
    userId: 12345,
    title: "Mystery Chronicles",
    description: "A collection of mysteries",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

export const NoSeries = () => <SeriesDropdown series={[]} />;

export const WithSeries = () => <SeriesDropdown series={mockSeries} />;

export const WithSelectedSeries = () => (
  <SeriesDropdown series={mockSeries} currentSeriesId="series-2" />
);

export const SingleSeries = () => (
  <SeriesDropdown series={[mockSeries[0]]} currentSeriesId="series-1" />
);
