// Import shared constants from JavaScript file (for tailwind.config.cjs compatibility)
import {
  DAISYUI_THEMES as THEMES_ARRAY,
  DEFAULT_THEME as DEFAULT,
} from "./themes-constants.js";

// Re-export with proper TypeScript typing
export const DAISYUI_THEMES = THEMES_ARRAY;

export type DaisyUITheme = (typeof THEMES_ARRAY)[number];

// Type guard to validate theme values
export function isValidTheme(theme: unknown): theme is DaisyUITheme {
  return (
    typeof theme === "string" &&
    (DAISYUI_THEMES as readonly string[]).includes(theme)
  );
}

// Default theme used across the application
export const DEFAULT_THEME: DaisyUITheme = DEFAULT;
