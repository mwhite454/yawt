# Events Feature Documentation

## Overview

The Events feature allows users to create and manage events within a series, with the ability to associate characters, scenes, and plotlines (tags) to each event. This provides a powerful way to track key moments and their relationships across the story.

## Accessing Events

From a series page, click the "Events" button in the navigation bar at the top of the page (alongside Characters, Locations, and Timelines).

Direct URL: `/series/{seriesId}/events`

## Creating an Event

The Events page includes an interactive form with the following fields:

### Basic Information
- **Title** (required): The name of the event
- **Description** (optional): A longer description of what happens in the event

### Temporal Information
- **Start Date** (optional): When the event begins (accepts any date format, e.g., "2023-01-15", "January 15, 2023")
- **End Date** (optional): When the event ends

### Associations

#### Location
Select a single location from the dropdown where the event takes place. Locations must be created on the Locations page first.

#### Characters
Interactive checkbox list allowing you to select multiple characters involved in the event:
- Click on any character to select/deselect them
- Selected characters are marked with a checkbox
- Characters must be created on the Characters page first

#### Scenes
Interactive checkbox list for associating scenes with the event:
- Shows scene titles along with the book they belong to (in parentheses)
- Multiple scenes can be selected by clicking
- Scenes must be created within books first

#### Plotlines / Tags
Manage tags that represent plotlines or themes:
- Enter a tag name in the input field
- Click "Add" or press Enter to add the tag
- Tags appear as removable badges below the input
- Click the "×" on any badge to remove that tag
- Examples: "romance", "battle", "mystery", "character development"

### Creating the Event
Click the "Create Event" button to save the event with all its associations.

## Viewing Events

Events are displayed in cards below the creation form, sorted by most recently updated. Each event card shows:

- **Title and Description**: The event's basic information
- **Dates**: Start and/or end dates if specified
- **Location**: The associated location name
- **Characters**: Badges showing all associated character names
- **Scenes**: Badges showing all associated scene titles
- **Plotlines**: Badges showing all tags/plotlines

## Technical Details

### Data Model
Events are stored with the following structure:
```typescript
interface Event {
  id: string;
  userId: number;
  seriesId: string;
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  locationId?: string;
  characterIds?: string[];
  sceneIds?: string[];
  tags?: string[];
  createdAt: number;
  updatedAt: number;
}
```

### Implementation
- **Route**: `/routes/series/[seriesId]/events.tsx`
- **Island**: `/islands/EventForm.tsx` (interactive form component)
- **API**: Uses existing `/api/series/[seriesId]/events` endpoints
- **Storage**: Deno KV with key pattern `["yawt", "event", userId, seriesId, eventId]`

### UX Features
- Checkbox-based multi-select (no need to hold Ctrl/Cmd)
- Tag management with visual badges
- Scene context shows book titles
- Reactive UI using Preact signals
- Follows existing daisyUI design patterns

## Use Cases

1. **Plot Tracking**: Create events for major plot points and tag them with relevant plotlines
2. **Character Arcs**: Associate characters with events they participate in to track their story arcs
3. **Timeline Building**: Link events to scenes to build a comprehensive timeline
4. **Theme Organization**: Use tags to categorize events by themes or plotlines
5. **Scene Planning**: Associate multiple scenes with a single event to show different perspectives or time periods

## Future Enhancements

Potential improvements that could be added:
- Event editing/deletion functionality
- Timeline view showing events chronologically
- Filtering events by character, location, or tag
- Event-to-event relationships (prerequisite events, parallel events)
- Export events to timeline visualization
- Event templates for common event types
