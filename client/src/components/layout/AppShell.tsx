import { Outlet, useMatch } from "react-router-dom";
import { Navbar } from "./Navbar";
import { useSeriesListQuery } from "@/hooks/use-series";

/**
 * Root application shell — wraps every protected page.
 * Reads the current seriesId from the URL to populate the navbar.
 */
export function AppShell() {
  const seriesMatch = useMatch("/series/:seriesId/*");
  const currentSeriesId = seriesMatch?.params.seriesId;

  const { data } = useSeriesListQuery();
  const series = data ?? [];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar series={series} currentSeriesId={currentSeriesId} />
      <main className="mx-auto max-w-[1440px] px-3 pb-4 pt-3 md:px-4">
        <div className="rounded border border-white/10 bg-gray-900 p-3 md:p-3">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
