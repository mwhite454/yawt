// Import shared constants from JavaScript file (for tailwind.config.cjs compatibility)
import {
  DAISYUI_THEMES as THEMES_ARRAY,
  DEFAULT_THEME as DEFAULT,
} from "./themes-constants.js";

// Re-export with proper TypeScript typing using 'as const'
export const DAISYUI_THEMES = THEMES_ARRAY as typeof THEMES_ARRAY;

export type DaisyUITheme = (typeof THEMES_ARRAY)[number];

// Default theme used across the application
export const DEFAULT_THEME: DaisyUITheme = DEFAULT;
