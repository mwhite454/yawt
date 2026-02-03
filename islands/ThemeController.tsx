import { useEffect, useState } from "preact/hooks";
import {
  DAISYUI_THEMES,
  DEFAULT_THEME,
  type DaisyUITheme,
} from "@utils/themes.ts";

interface ThemeControllerProps {
  currentTheme?: DaisyUITheme;
  isLoggedIn?: boolean;
}

export default function ThemeController({
  currentTheme = DEFAULT_THEME,
  isLoggedIn = false,
}: ThemeControllerProps) {
  const [theme, setTheme] = useState<DaisyUITheme>(currentTheme);
  const [isOpen, setIsOpen] = useState(false);

  // Apply theme on mount and when it changes
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    // Store in localStorage for persistence across page loads
    localStorage.setItem("theme", theme);
  }, [theme]);

  // On mount, determine the correct theme to use
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as DaisyUITheme | null;

    if (isLoggedIn && currentTheme && currentTheme !== DEFAULT_THEME) {
      // If logged in and server provided a non-default theme, use it
      // and sync to localStorage
      if (currentTheme !== savedTheme) {
        setTheme(currentTheme);
      }
    } else if (savedTheme && DAISYUI_THEMES.includes(savedTheme)) {
      // Otherwise use localStorage theme if available
      if (savedTheme !== theme) {
        setTheme(savedTheme);
      }
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".theme-controller-dropdown")) {
        setIsOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isOpen]);

  const handleThemeChange = async (newTheme: DaisyUITheme) => {
    setTheme(newTheme);
    setIsOpen(false);

    // If user is logged in, persist to server
    if (isLoggedIn) {
      try {
        await fetch("/api/me", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ defaultTheme: newTheme }),
        });
      } catch (error) {
        console.error("Failed to save theme preference:", error);
      }
    }
  };

  // Format theme name for display
  const formatThemeName = (themeName: string) => {
    return themeName
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div class="theme-controller-dropdown relative">
      <button
        type="button"
        class="btn btn-ghost btn-xs gap-1"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
      >
        <div data-theme={theme} class="flex gap-0.5 rounded p-0.5 bg-base-100">
          <div class="w-1 h-3 rounded-sm bg-primary"></div>
          <div class="w-1 h-3 rounded-sm bg-secondary"></div>
          <div class="w-1 h-3 rounded-sm bg-accent"></div>
          <div class="w-1 h-3 rounded-sm bg-neutral"></div>
        </div>
        <span class="text-xs">{formatThemeName(theme)}</span>
      </button>
      {isOpen && (
        <ul class="absolute right-full top-0 flex flex-col bg-base-200 rounded-box z-[100] w-48 p-2 shadow-lg max-h-80 overflow-y-auto overflow-x-hidden mr-1">
          {DAISYUI_THEMES.map((themeName) => (
            <li key={themeName} class="w-full">
              <button
                type="button"
                class={`flex items-center gap-2 text-xs py-1.5 px-2 rounded w-full hover:bg-base-300 ${theme === themeName ? "bg-primary text-primary-content" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleThemeChange(themeName);
                }}
              >
                <div
                  data-theme={themeName}
                  class="flex gap-0.5 rounded p-0.5 bg-base-100"
                >
                  <div class="w-1 h-3 rounded-sm bg-primary"></div>
                  <div class="w-1 h-3 rounded-sm bg-secondary"></div>
                  <div class="w-1 h-3 rounded-sm bg-accent"></div>
                  <div class="w-1 h-3 rounded-sm bg-neutral"></div>
                </div>
                <span>{formatThemeName(themeName)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
