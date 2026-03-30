# Makerbeam-Botics UI Styling Guide

A reference for matching the look, feel, and energy of this dark-themed, engineering-focused React app. Use this to style forms, panels, tabs, and preferences UIs with the same crisp, dense, professional aesthetic.

---

## Design Philosophy

- **Dark everything.** Deep grays dominate; colored accents are intentional and semantic.
- **Dense but breathable.** Compact spacing (8–12px) with just enough room to breathe.
- **Color communicates.** Blue = primary/interactive. Amber/yellow = warning/formula. Green = code/output. Red = delete/danger.
- **Transitions everywhere.** Every interactive element uses `transition-colors` or `transition-all`. Nothing should feel static.
- **Monospace for data.** All values, expressions, and code use a monospace font.
- **No fluff.** No custom fonts, no decorative illustrations. Clean, purposeful, tool-like.

---

## Color Palette

### Background Layers (darkest → lightest)
| Role | Value |
|---|---|
| App shell / canvas | `#030712` (`gray-950`) |
| Primary panel bg | `#111827` (`gray-900`) |
| Card / input bg | `#1f2937` (`gray-800`) |
| Hover state bg | `#374151` (`gray-700`) |
| Muted bg | `#4b5563` (`gray-600`) |

### Text
| Role | Value |
|---|---|
| Primary | `#ffffff` |
| Secondary | `#d1d5db` (`gray-300`) |
| Muted | `#9ca3af` (`gray-400`) |
| Placeholder / subtle | `#6b7280` (`gray-500`) |
| Disabled | `#4b5563` (`gray-600`) |

### Borders
| Role | Value |
|---|---|
| Primary border | `rgba(255,255,255,0.10)` |
| Fine divider | `rgba(255,255,255,0.05)` |
| Interactive / input border | `#374151` |
| Focus border | `#3b82f6` (blue-500) |

### Accent Colors
| Color | Hex | Use |
|---|---|---|
| Blue | `#3b82f6` | Primary actions, focus rings, active tabs |
| Blue dark | `#2563eb` | Button hover, primary bg |
| Amber/Yellow | `#eab308` | App badge, MakerBeam brand |
| Amber light | `#fbbf24` | Formula/expression highlights |
| Green | `#22c55e` | Success, code output, ready state |
| Red | `#ef4444` | Delete, error, danger |
| Purple | `#9333ea` | Module tabs, sketch-related |
| Pink | `#ec4899` | Sketch mode borders/tabs |
| Cyan | `#06b6d4` | 2D element category |

### Semantic Alpha Colors
```
rgba(255, 255, 255, 0.04)  — separator background
rgba(255, 255, 255, 0.10)  — panel borders (most borders)
rgba(255, 255, 255, 0.15)  — separator inner line
rgba(59, 130, 246, 0.30)   — separator hover background
rgba(59, 130, 246, 0.70)   — separator active inner line
```

---

## Typography

**Font family:** System default — no custom fonts loaded. Falls back to OS sans-serif.

**Monospace:** `font-mono` (Menlo, Monaco, Courier New) — used for all values, expressions, and code.

### Type Scale
| Size | Value | Used for |
|---|---|---|
| `text-[9px]` | 9px | Type badges, handle labels, micro annotations |
| `text-[10px]` | 10px | Panel headers, status dots, table column headers |
| `text-[11px]` | 11px | Toolbar buttons, tab labels, form labels, code |
| `text-xs` | 12px | Input fields, node field values, general body |
| `text-sm` | 14px | Project names, search results, panel titles |

**Weights:**
- Panel/table headers: `font-bold` + `tracking-widest` + `uppercase`
- Toolbar buttons: `font-semibold`
- Tab labels: `font-medium`
- Input values: regular (400)
- Code / expression values: `font-mono` regular

**Letter spacing:**
- ALL CAPS labels: `tracking-widest` (0.1em) — this is the signature look of panel headers
- Category sub-headers: `tracking-wider` (0.05em)
- Node titles: `tracking-wide` (0.025em)

---

## Spacing

### Padding
| Token | Value | Used for |
|---|---|---|
| `px-1.5 py-1` | 6px / 4px | Small inputs |
| `px-2 py-1` | 8px / 4px | Toolbar buttons |
| `px-3 py-1.5` | 12px / 6px | Headers, panel rows |
| `px-4 py-2` | 16px / 8px | Main content areas |
| `px-3 py-2.5` | 12px / 10px | Panel headers with subtitles |

### Gap
| Token | Value | Used for |
|---|---|---|
| `gap-1` | 4px | Tight icon + text |
| `gap-1.5` | 6px | Icon + label in buttons |
| `gap-2` | 8px | Standard horizontal groups |
| `gap-3` | 12px | Stacked form fields |

### Fixed Dimensions
| Element | Value |
|---|---|
| Toolbar height | `h-10` (40px) |
| Tab bar height | `h-8` (32px) |
| Status dot | `w-2 h-2` (8px, `rounded-full`) |
| Scrollbar width | 4px |
| Panel separator | 6px wide |

---

## Borders & Radius

**Border radius:**
- `rounded` (4px) — barely used
- `rounded-lg` (8px) — default for inputs, cards, panels, nodes
- `rounded-full` — status indicators, circular badges only

**Border widths:**
- 1px default on everything
- `border-l-2` for "connected" state on expression inputs (left accent stripe)
- `border-t-2` on tab items (active = blue, inactive = transparent)

**Focus ring:**
```css
focus:outline-none focus:border-blue-500
```
No `ring-*` utilities for focus — just border color changes.

---

## Shadows

```
shadow-xl   — cards, dropdowns, context menus
shadow-2xl  — tooltips, popovers
```

Nodes also use subtle colored ring shadows for state:
```
ring-2 ring-yellow-400/60   — search match
ring-1 ring-blue-400/50     — selected
```

No raised/card shadows on panels — separation is done with borders only.

---

## Transitions & Animation

**Every interactive element transitions.** Minimum: `transition-colors`. Use `transition-all` when transforms are involved.

```css
transition-colors   /* buttons, borders, text color changes */
transition-all      /* nodes, separators */
transition-opacity  /* delete/secondary buttons that appear on hover */
transition-transform /* scale effects */
```

**Durations:** Tailwind default (150ms). The separator CSS explicitly sets `0.15s`.

**Animations in use:**
- `animate-pulse` — loading states, status indicators
- `animate-spin` — rendering spinner (inline element, small)

**Hover scale:**
```css
hover:scale-110  /* small handle hover, icon hover */
```

**Keep it short and snappy.** No 300ms+ transitions unless something is entering/exiting the DOM.

---

## Component Patterns

### Toolbar
```
h-10 bg-gray-950 border-b border-white/10 flex items-center gap-3 px-4
```

- **Buttons:** `text-[11px] text-gray-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-gray-800`
- **Vertical separator:** `w-px h-5 bg-gray-700`
- **Primary action button:** `px-3 py-1 rounded text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all`
- **Toggle button group:** `flex rounded overflow-hidden border border-white/10`
  - Active: `bg-blue-600 text-white`
  - Inactive: `bg-gray-800 text-gray-400 hover:bg-gray-700`

### Tab Bar
```
h-8 bg-gray-900 border-t border-white/10 flex items-stretch overflow-x-auto
```

Tab item states:
- **Active:** `bg-gray-800 text-white border-t-2 border-t-blue-500`
- **Inactive:** `bg-gray-900 text-gray-500 hover:text-gray-300 hover:bg-gray-800/50 border-t-2 border-t-transparent`

Type badge pill (sits inside tab):
```
text-[8px] rounded px-1 py-0 font-bold uppercase
bg-purple-600/50 text-purple-300   /* module */
bg-pink-600/50 text-pink-300       /* sketch */
bg-amber-700/60 text-amber-300     /* loop */
```

### Panel Header
```html
<div class="px-3 py-2 border-b border-white/10 flex items-center justify-between shrink-0">
  <span class="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Panel Title</span>
</div>
```

This uppercase + `tracking-widest` + `text-gray-500` combo is the signature panel header style.

### Form Inputs

**Text / number input:**
```
bg-gray-800 border border-gray-700 rounded px-1.5 py-1 text-xs text-white
focus:outline-none focus:border-blue-500
```

**Select:**
```
bg-gray-800 border border-gray-700 rounded px-1 py-0.5 text-xs text-gray-200
focus:outline-none focus:border-blue-500
```

**Checkbox:**
```
accent-blue-500
```

**Expression / formula field** (value that can toggle between literal and formula):
- Default: same as number input
- Formula mode: `border border-amber-500/60 focus:border-amber-400 text-amber-200`
- Connected (has incoming data): `border-l-2 border-l-blue-400 focus:border-l-blue-300`

**Inline edit (table cell):**
```
bg-gray-700 border border-blue-500 rounded px-2 py-1 text-xs text-white focus:outline-none font-mono
```

### Buttons

**Primary:**
```
bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-3 py-1.5 rounded transition-colors
```

**Secondary/ghost:**
```
text-[11px] text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-gray-800 transition-colors
```

**Danger (appears on hover, opacity trick):**
```
opacity-50 hover:opacity-100 transition-opacity text-red-400
```

**Disabled:**
```
bg-gray-600 text-gray-400 cursor-not-allowed
```

### Dropdown / Autocomplete
```
bg-gray-800 border border-gray-600 rounded shadow-xl min-w-[120px] max-h-40 overflow-y-auto
```
Items:
- Active: `bg-blue-600 text-white`
- Default: `text-green-300 hover:bg-gray-700`

Item text: `text-[11px] font-mono`

### Context Menu
```
bg-gray-900 border border-gray-700 rounded shadow-xl py-1 min-w-[160px]
```
Item: `px-3 py-1.5 text-[12px] text-gray-300 hover:bg-gray-700 hover:text-white transition-colors`

### Panel Separator (Resize Handle)
```css
width: 6px;
background: rgba(255, 255, 255, 0.04);
transition: background-color 0.15s;
/* inner line */
width: 2px; height: 24px; border-radius: 1px;
background: rgba(255, 255, 255, 0.15);
transition: background-color 0.15s;
```
On hover/drag:
```css
background: rgba(59, 130, 246, 0.30);  /* outer */
background: rgba(59, 130, 246, 0.70);  /* inner line */
```

### Status Indicator Dot
```html
<span class="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>  <!-- loading -->
<span class="w-2 h-2 rounded-full bg-green-400"></span>                  <!-- ready -->
<span class="w-2 h-2 rounded-full bg-red-500"></span>                    <!-- error -->
```
Label alongside: `text-[10px] text-gray-400`

### Empty State
```html
<div class="flex flex-col items-center justify-center h-full text-center px-8 gap-3">
  <span class="text-4xl opacity-20">🗂️</span>
  <p class="text-sm text-gray-500">Nothing here yet.</p>
</div>
```

### Custom Scrollbar
```css
::-webkit-scrollbar { width: 4px; height: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #374151; border-radius: 2px; }
::-webkit-scrollbar-thumb:hover { background: #4b5563; }
```

---

## Preferences / Settings UI Specifics

When building a preferences panel in this style:

- Use `bg-gray-950` as the page background
- Divide into sections with `border-b border-white/10` separators
- Section headers: `text-[10px] font-bold text-gray-500 uppercase tracking-widest px-3 py-2`
- Each row: `flex items-center justify-between px-4 py-2 hover:bg-gray-900/50 transition-colors`
- Row label: `text-xs text-gray-300`
- Row description: `text-[11px] text-gray-500 mt-0.5`
- Control (right side): input, select, or toggle — all in `bg-gray-800` style above
- Save/Apply button: full primary button style at bottom of form

**Toggle switch** (not in codebase but fits this style):
```
Track off: bg-gray-700
Track on: bg-blue-600
Thumb: bg-white rounded-full
Transition: transition-colors 150ms
```

---

## Quick Reference Cheatsheet

```
Dark bg:         bg-gray-950 / bg-gray-900 / bg-gray-800
Borders:         border-white/10  (standard)   border-white/5  (fine)
Focus:           focus:border-blue-500  (always pair with focus:outline-none)
Text hierarchy:  white → gray-300 → gray-400 → gray-500 → gray-600
Panel headers:   text-[10px] font-bold text-gray-500 uppercase tracking-widest
All transitions: transition-colors (minimum on every interactive element)
Code/values:     font-mono text-green-400 (output)  text-amber-200 (expression)
Primary action:  bg-blue-600 hover:bg-blue-500
Danger:          text-red-400 (text) / bg-red-600 (bg)
Radius default:  rounded-lg
Shadow default:  shadow-xl
```
