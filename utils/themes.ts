// Import shared constants from JavaScript file (for tailwind.config.cjs compatibility)
import {
  DAISYUI_THEMES as THEMES_ARRAY,
  DEFAULT_THEME as DEFAULT,
} from "./themes-constants.js";

// Re-export with proper TypeScript typing
export const DAISYUI_THEMES = THEMES_ARRAY as readonly [
  "light",
  "dark",
  "cupcake",
  "bumblebee",
  "emerald",
  "corporate",
  "synthwave",
  "retro",
  "cyberpunk",
  "valentine",
  "halloween",
  "garden",
  "forest",
  "aqua",
  "lofi",
  "pastel",
  "fantasy",
  "wireframe",
  "black",
  "luxury",
  "dracula",
  "cmyk",
  "autumn",
  "business",
  "acid",
  "lemonade",
  "night",
  "coffee",
  "winter",
  "dim",
  "nord",
  "sunset",
  "yawt",
  "yawt-dark",
];

export type DaisyUITheme = (typeof DAISYUI_THEMES)[number];

// Default theme used across the application
export const DEFAULT_THEME: DaisyUITheme = DEFAULT as DaisyUITheme;
