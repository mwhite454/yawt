/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./routes/**/*.{ts,tsx}",
    "./islands/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        yawt: {
          "color-scheme": "light",

          "base-100": "oklch(58% 0.233 277.117)",
          "base-200": "oklch(39% 0.195 277.366)",
          "base-300": "oklch(25% 0.09 281.288)",
          "base-content": "oklch(93% 0.034 272.788)",

          primary: "oklch(71% 0.202 349.761)",
          "primary-content": "oklch(28% 0.109 3.907)",

          secondary: "oklch(90% 0.058 230.902)",
          "secondary-content": "oklch(29% 0.066 243.157)",

          accent: "oklch(75% 0.183 55.934)",
          "accent-content": "oklch(26% 0.079 36.259)",

          neutral: "oklch(45% 0.24 277.023)",
          "neutral-content": "oklch(96% 0.018 272.314)",

          info: "oklch(74% 0.16 232.661)",
          "info-content": "oklch(29% 0.066 243.157)",

          success: "oklch(77% 0.152 181.912)",
          "success-content": "oklch(27% 0.046 192.524)",

          warning: "oklch(90% 0.182 98.111)",
          "warning-content": "oklch(28% 0.066 53.813)",

          error: "oklch(70% 0.191 22.216)",
          "error-content": "oklch(0% 0 0)",

          // Extra theme tokens (kept as custom CSS variables; daisyUI v4 will
          // ignore unknown vars, but they’ll be present on [data-theme=yawt]).
          "--color-base-100": "oklch(58% 0.233 277.117)",
          "--color-base-200": "oklch(39% 0.195 277.366)",
          "--color-base-300": "oklch(25% 0.09 281.288)",
          "--color-base-content": "oklch(93% 0.034 272.788)",
          "--color-primary": "oklch(71% 0.202 349.761)",
          "--color-primary-content": "oklch(28% 0.109 3.907)",
          "--color-secondary": "oklch(90% 0.058 230.902)",
          "--color-secondary-content": "oklch(29% 0.066 243.157)",
          "--color-accent": "oklch(75% 0.183 55.934)",
          "--color-accent-content": "oklch(26% 0.079 36.259)",
          "--color-neutral": "oklch(45% 0.24 277.023)",
          "--color-neutral-content": "oklch(96% 0.018 272.314)",
          "--color-info": "oklch(74% 0.16 232.661)",
          "--color-info-content": "oklch(29% 0.066 243.157)",
          "--color-success": "oklch(77% 0.152 181.912)",
          "--color-success-content": "oklch(27% 0.046 192.524)",
          "--color-warning": "oklch(90% 0.182 98.111)",
          "--color-warning-content": "oklch(28% 0.066 53.813)",
          "--color-error": "oklch(70% 0.191 22.216)",
          "--color-error-content": "oklch(0% 0 0)",
          "--radius-selector": "1rem",
          "--radius-field": "1rem",
          "--radius-box": "0.25rem",
          "--size-selector": "0.21875rem",
          "--size-field": "0.21875rem",
          "--border": "1.5px",
          "--depth": "0",
          "--noise": "1",

          // Closest daisyUI v4 equivalents for radius/border.
          "--rounded-box": "0.25rem",
          "--rounded-btn": "1rem",
          "--rounded-badge": "1rem",
          "--border-btn": "1.5px",
          "--tab-radius": "1rem",
        },
      },
      "nord",
    ],
  },
};
