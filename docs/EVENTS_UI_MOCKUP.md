# Events UI Mockup Description

This document describes the visual layout and appearance of the Events interface.

## Page Layout

### Breadcrumb Navigation
```
Series > [Series Name] > Events
```

### Main Content Area

#### 1. Event Creation Card
A white card with shadow containing:

**Header:** "Events" (large, bold)

**Form Fields:**
1. **Title Input**
   - Single-line text input
   - Placeholder: "Event title"
   - Required field

2. **Description Textarea**
   - Multi-line text area (3 rows)
   - Placeholder: "Description (optional)"

3. **Date Fields** (2 columns on medium+ screens)
   - Left: Start Date
     - Label: "Start Date"
     - Input placeholder: "YYYY-MM-DD or any date format"
   - Right: End Date
     - Label: "End Date"
     - Input placeholder: "YYYY-MM-DD or any date format"

4. **Location Dropdown**
   - Label: "Location"
   - Dropdown with "None" as first option
   - Lists all available locations by name

5. **Characters Section**
   - Label: "Characters"
   - Bordered box with scrollable content (max height ~12rem)
   - Each character displayed as:
     ```
     [ ] Character Name
     ```
   - Checkbox becomes checked when clicked
   - Hover effect shows light background
   - If no characters exist: "No characters available" message

6. **Scenes Section**
   - Label: "Scenes"
   - Bordered box with scrollable content (max height ~12rem)
   - Each scene displayed as:
     ```
     [ ] Scene Title (Book Name)
     ```
   - Checkbox becomes checked when clicked
   - Book name shown in smaller, lighter text
   - Hover effect shows light background
   - If no scenes exist: "No scenes available" message

7. **Plotlines / Tags Section**
   - Label: "Plotlines / Tags"
   - Input field with "Add" button on the right
   - Placeholder: "Add a tag..."
   - Added tags shown as badges below:
     ```
     [romance ×] [battle ×] [mystery ×]
     ```
   - Each badge has accent color with remove button (×)
   - Helper text: "Enter tags and press Add or Enter"

8. **Action Button**
   - "Create Event" button (primary color, right-aligned)

---

#### 2. Event List Section

Below the creation form, existing events are displayed as cards:

**Event Card Example:**
```
┌─────────────────────────────────────────────┐
│ The Great Battle                             │
│ A climactic confrontation between the        │
│ protagonist and antagonist...                │
│                                              │
│ Start: 2023-06-15    Location: Castle       │
│ End: 2023-06-16                              │
│                                              │
│ Characters:                                  │
│ [Hero] [Villain] [Sidekick]                 │
│                                              │
│ Scenes:                                      │
│ [Battle Begins] [Final Showdown]            │
│                                              │
│ Plotlines:                                   │
│ [battle] [climax] [character development]   │
└─────────────────────────────────────────────┘
```

Each event card includes:
- **Title** (bold, larger text)
- **Description** (if provided, lighter text, preserves line breaks)
- **Dates & Location** (2-column grid on medium+ screens)
  - Start date (if provided)
  - End date (if provided)
  - Location name (if provided)
- **Character Badges** (primary color)
  - Shows character names as small badges
- **Scene Badges** (secondary color)
  - Shows scene titles as small badges
- **Plotline Badges** (accent color)
  - Shows tags as small badges

**Empty State:**
If no events exist:
```
┌─────────────────────────────────┐
│ ℹ No events yet. Create one     │
│   above.                        │
└─────────────────────────────────┘
```

## Color Scheme (daisyUI)
- Cards: white background with light shadow
- Primary buttons/badges: theme primary color
- Secondary badges: theme secondary color
- Accent badges: theme accent color
- Borders: light gray (base-300)
- Hover states: base-200 background

## Responsive Behavior
- **Mobile**: Single column layout, fields stack vertically
- **Tablet+**: Date fields display in 2 columns, event metadata in 2 columns
- **Desktop**: Same as tablet with more comfortable spacing

## Interactive Elements
- ✅ Checkboxes toggle on/off when clicked
- ✅ Character/Scene lists highlight on hover
- ✅ Tag input accepts Enter key to add tag
- ✅ Tag badges can be removed by clicking ×
- ✅ Form submits via POST and page reloads to show new event
- ✅ Scroll bars appear when character/scene lists exceed max height

## Navigation
The series page navigation includes a new "Events" button:
```
[Characters] [Locations] [Timelines] [Events]
```
All buttons use the same styling (small buttons in a joined group).
