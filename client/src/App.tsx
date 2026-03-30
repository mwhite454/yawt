import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { SeriesListPage } from "@/pages/SeriesListPage";
import { SeriesDetailPage } from "@/pages/SeriesDetailPage";
import { BookDetailPage } from "@/pages/BookDetailPage";
import { BookSettingsPage } from "@/pages/BookSettingsPage";
import { CharactersPage } from "@/pages/CharactersPage";
import { CharacterTypesPage } from "@/pages/CharacterTypesPage";
import { LocationsPage } from "@/pages/LocationsPage";
import { TimelinesPage } from "@/pages/TimelinesPage";
import { TimelineDetailPage } from "@/pages/TimelineDetailPage";
import { AdminPage } from "@/pages/AdminPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

export default function App() {
  return (
    <BrowserRouter basename="/client">
      <Routes>
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/series" replace />} />
          <Route path="series" element={<SeriesListPage />} />
          <Route path="series/:seriesId" element={<SeriesDetailPage />} />
          <Route
            path="series/:seriesId/books/:bookId"
            element={<BookDetailPage />}
          />
          <Route
            path="series/:seriesId/books/:bookId/settings"
            element={<BookSettingsPage />}
          />
          <Route
            path="series/:seriesId/characters"
            element={<CharactersPage />}
          />
          <Route
            path="series/:seriesId/character-types"
            element={<CharacterTypesPage />}
          />
          <Route
            path="series/:seriesId/locations"
            element={<LocationsPage />}
          />
          <Route
            path="series/:seriesId/timelines"
            element={<TimelinesPage />}
          />
          <Route
            path="series/:seriesId/timelines/:timelineId"
            element={<TimelineDetailPage />}
          />
          <Route path="admin" element={<AdminPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
