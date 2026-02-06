# Drag and Drop Scenes Between Chapters

## Overview

This feature allows users to drag and drop scenes between chapters and between chapter-level and book-level locations within a book.

## User Experience

### What Users Can Do

1. **Drag scenes within the same chapter** - Reorder scenes within a chapter
2. **Drag scenes from one chapter to another** - Move scenes between different chapters
3. **Drag scenes from book-level to a chapter** - Organize book-level scenes into chapters
4. **Drag scenes from a chapter to book-level** - Remove scenes from chapters and place them at book level
5. **Visual feedback** - See drop targets highlighted during drag operations

### How to Use

1. Navigate to a book's detail page
2. In the "Structure" panel on the left, you'll see:
   - Book-level scenes (if any)
   - Expandable chapters with their scenes
3. Click and hold on any scene (look for the ⋮⋮ handle)
4. Drag the scene to a new location:
   - Hover over the position where you want to drop
   - You'll see a visual indicator showing where the scene will be placed
5. Release to drop the scene in the new location
6. The page will reload to show the updated structure

## Technical Implementation

### API Endpoint

**POST** `/api/series/[seriesId]/books/[bookId]/scenes/[sceneId]/move`

**Request Body:**
```json
{
  "targetChapterId": "chapter-uuid",
  "beforeSceneId": "scene-uuid",
  "afterSceneId": "scene-uuid"
}
```

Or for book-level:
```json
{
  "targetChapterId": null,
  "beforeSceneId": "scene-uuid",
  "afterSceneId": "scene-uuid"
}
```

- `targetChapterId`: The chapter to move the scene to (string), or `null` for book-level (required)
- `beforeSceneId`: Position the scene before this scene (optional)
- `afterSceneId`: Position the scene after this scene (optional)

If neither `beforeSceneId` nor `afterSceneId` is provided, the scene is appended to the end of the target location.

**Response:**
```json
{
  "scene": {
    "id": "scene-uuid",
    "chapterId": "chapter-uuid",
    "rank": "new-rank-value"
  }
}
```

Or for book-level scenes:
```json
{
  "scene": {
    "id": "scene-uuid",
    "rank": "new-rank-value"
  }
}
```

### Component Architecture

**HierarchicalSceneList** (`islands/HierarchicalSceneList.tsx`)
- Main island component handling drag and drop functionality
- Manages drag state (dragged scene, drop target)
- Provides visual feedback during drag operations
- Calls the move API endpoint on drop
- Handles all edge cases (self-references, empty lists, etc.)

### Data Structure

Scenes have a `chapterId` field that determines their location:
- `chapterId: undefined` - Book-level scene (7-part KV order key)
- `chapterId: "uuid"` - Chapter scene (8-part KV order key)

The order keys are structured as:
- Book-level: `["yawt", "sceneOrder", userId, seriesId, bookId, rank, sceneId]`
- Chapter-level: `["yawt", "sceneOrder", userId, seriesId, bookId, chapterId, rank, sceneId]`

### Atomic Operations

When moving a scene, the API uses atomic KV operations to ensure consistency:
1. Delete the old order key (at the original location)
2. Update the scene record (with new `chapterId` and `rank`)
3. Create the new order key (at the target location)

All three operations are executed atomically, so if any fail, none are applied.

### Ranking System

Scenes use fractional indexing for their `rank` field, allowing efficient insertion between any two scenes without renumbering. The `rankBetween(a, b)` function from `utils/story/rank.ts` calculates a lexicographically-sortable rank between two bounds.

## Known Limitations

1. **Page Reload**: After each move, the page reloads to ensure data consistency. This could be optimized in the future to update the UI locally.
2. **No Undo**: There's no built-in undo functionality. Users would need to manually drag scenes back to their original positions.
3. **Desktop-focused**: Drag and drop is primarily designed and tested for desktop browsers with mouse/trackpad input; touch devices may have limited or unreliable support.

## Future Enhancements

Potential improvements:
- Optimistic UI updates (update state locally before reload)
- Bulk move operations (move multiple scenes at once)
- Keyboard shortcuts for moving scenes
- Undo/redo functionality
- Better touch device support
- Animation during scene transitions
