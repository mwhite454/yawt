import { Crown, Feather, LogOut } from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import type { Series } from "@/types/story";

interface NavbarProps {
  series: Series[];
  currentSeriesId?: string;
}

const seriesNavPages = [
  { to: "", label: "Books", end: true },
  { to: "characters", label: "Characters" },
  { to: "character-types", label: "Types" },
  { to: "locations", label: "Locations" },
  { to: "timelines", label: "Timelines" },
  { to: "events", label: "Events" },
] as const;

export function Navbar({ series, currentSeriesId }: NavbarProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  function handleSignOut() {
    window.location.href = "/auth/signout";
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-gray-950/95 backdrop-blur">
      <div className="mx-auto max-w-[1440px] px-4 md:px-6">
        <div className="flex h-10 items-center gap-3">
          <Link to={user ? "/series" : "/"} className="flex items-center gap-2">
            <Feather className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              YAWT
            </span>
          </Link>

          {user && series.length > 0 && (
            <div className="hidden min-w-52 items-center gap-2 md:flex">
              <Badge variant="outline">Series</Badge>
              <Select
                value={currentSeriesId ?? ""}
                onChange={(e) => {
                  if (e.target.value) navigate(`/series/${e.target.value}`);
                }}
              >
                <option value="" disabled>
                  Select series
                </option>
                {series.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </Select>
            </div>
          )}

          {user && currentSeriesId && (
            <nav className="hidden items-stretch gap-1 md:flex">
              {seriesNavPages.map((item) => (
                <NavLink
                  key={item.label}
                  to={
                    item.to
                      ? `/series/${currentSeriesId}/${item.to}`
                      : `/series/${currentSeriesId}`
                  }
                  end={"end" in item ? item.end : false}
                  className={({ isActive }) =>
                    `border-t-2 px-2 py-1 text-[11px] font-medium transition-colors ${
                      isActive
                        ? "border-t-blue-500 bg-gray-800 text-white"
                        : "border-t-transparent text-gray-500 hover:bg-gray-800/50 hover:text-gray-300"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          )}

          <div className="flex-1" />

          {user ? (
            <div className="flex items-center gap-2">
              {user.role === "admin" && (
                <Link to="admin">
                  <Button variant="ghost" size="sm">
                    <Crown className="h-3.5 w-3.5" />
                    Admin
                  </Button>
                </Link>
              )}
              <span className="hidden text-[11px] text-gray-400 sm:inline">
                {user.login}
              </span>
              <Button onClick={handleSignOut} variant="outline" size="sm">
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </Button>
            </div>
          ) : (
            <a
              href="/auth/signin"
              className="inline-flex items-center rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-blue-500"
            >
              Sign in with GitHub
            </a>
          )}
        </div>
      </div>

      {user && currentSeriesId && (
        <div className="overflow-x-auto border-t border-white/10 md:hidden">
          <div className="mx-auto max-w-[1440px] px-4 pb-2 pt-2 md:px-6">
            {series.length > 0 && (
              <Select
                className="mb-2"
                value={currentSeriesId ?? ""}
                onChange={(e) => {
                  if (e.target.value) navigate(`/series/${e.target.value}`);
                }}
              >
                <option value="" disabled>
                  Select series
                </option>
                {series.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </Select>
            )}
            <nav className="flex items-stretch gap-1">
              {seriesNavPages.map((item) => (
                <NavLink
                  key={item.label}
                  to={
                    item.to
                      ? `/series/${currentSeriesId}/${item.to}`
                      : `/series/${currentSeriesId}`
                  }
                  end={"end" in item ? item.end : false}
                  className={({ isActive }) =>
                    `whitespace-nowrap border-t-2 px-2 py-1 text-[11px] font-medium transition-colors ${
                      isActive
                        ? "border-t-blue-500 bg-gray-800 text-white"
                        : "border-t-transparent text-gray-500 hover:bg-gray-800/50 hover:text-gray-300"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
