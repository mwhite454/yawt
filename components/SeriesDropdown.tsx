import type { Series } from "@utils/story/types.ts";

export interface SeriesDropdownProps {
  series: Series[];
  currentSeriesId?: string;
}

export function SeriesDropdown(props: SeriesDropdownProps) {
  const { series, currentSeriesId } = props;
  const currentSeries = currentSeriesId
    ? series.find((s) => s.id === currentSeriesId)
    : undefined;

  if (series.length === 0) {
    return (
      <a href="/series" class="btn btn-ghost btn-sm gap-1">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 4v16m8-8H4"
          />
        </svg>
        Add Series
      </a>
    );
  }

  return (
    <div class="dropdown dropdown-end">
      <div tabIndex={0} role="button" class="btn btn-ghost btn-sm gap-1">
        {currentSeries?.title ?? "Series"}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
      <ul
        tabIndex={0}
        class="dropdown-content menu bg-base-100 rounded-box z-10 w-56 p-2 shadow mt-2"
      >
        {series.map((s) => (
          <li key={s.id}>
            <a
              href={`/series/${s.id}`}
              class={s.id === currentSeriesId ? "active" : ""}
            >
              {s.title}
            </a>
          </li>
        ))}
        <li class="border-t border-base-300 mt-2 pt-2">
          <a href="/series" class="gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Series
          </a>
        </li>
      </ul>
    </div>
  );
}
