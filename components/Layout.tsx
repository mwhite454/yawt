import { type ComponentChildren } from "preact";
import type { User } from "@utils/session.ts";
import type { Series } from "@utils/story/types.ts";
import { UserMenu } from "@components/UserMenu.tsx";
import { SeriesDropdown } from "@components/SeriesDropdown.tsx";

export function Layout(props: {
  user: User | null;
  title?: string;
  series?: Series[];
  currentSeriesId?: string;
  currentPage?: "books" | "characters" | "locations" | "timelines" | "events";
  children: ComponentChildren;
}) {
  const title = props.title ?? "YAWT";
  const seriesId = props.currentSeriesId;

  // Navigation items for series-level pages
  const seriesNavItems = seriesId
    ? [
      { href: `/series/${seriesId}`, label: "Books", page: "books" as const },
      {
        href: `/series/${seriesId}/characters`,
        label: "Characters",
        page: "characters" as const,
      },
      {
        href: `/series/${seriesId}/locations`,
        label: "Locations",
        page: "locations" as const,
      },
      {
        href: `/series/${seriesId}/timelines`,
        label: "Timelines",
        page: "timelines" as const,
      },
      {
        href: `/series/${seriesId}/events`,
        label: "Events",
        page: "events" as const,
      },
    ]
    : [];

  return (
    <div class="min-h-screen bg-base-200">
      <div class="navbar bg-base-100 shadow-sm">
        <div class="max-w-full sm:max-w-full md:max-w-6xl lg:max-w-7xl xl:max-w-[1600px] 2xl:max-w-[1920px] mx-auto w-full px-2 sm:px-4">
          <div class="navbar-start">
            <a class="btn btn-ghost text-xl" href={props.user ? "/series" : "/"}>
              {title}
            </a>
          </div>
          <div class="navbar-center hidden md:flex gap-2">
            {props.user && props.series && (
              <>
                <SeriesDropdown
                  series={props.series}
                  currentSeriesId={props.currentSeriesId}
                />
                {seriesNavItems.length > 0 && (
                  <ul class="menu menu-horizontal px-1">
                    {seriesNavItems.map((item) => (
                      <li key={item.href}>
                        <a
                          href={item.href}
                          class={props.currentPage === item.page ? "active" : ""}
                        >
                          {item.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
          <div class="navbar-end">
            <UserMenu user={props.user} />
          </div>
        </div>
      </div>

      {/* Mobile navigation for series pages */}
      {props.user && seriesNavItems.length > 0 && (
        <div class="md:hidden bg-base-100 border-b border-base-300 overflow-x-auto">
          <ul class="menu menu-horizontal w-full flex-nowrap">
            {seriesNavItems.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  class={`whitespace-nowrap ${
                    props.currentPage === item.page ? "active" : ""
                  }`}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <main class="p-2 sm:p-4 md:p-6 lg:p-8">
        <div class="max-w-full sm:max-w-full md:max-w-6xl lg:max-w-7xl xl:max-w-[1600px] 2xl:max-w-[1920px] mx-auto">
          {props.children}
        </div>
      </main>
    </div>
  );
}
