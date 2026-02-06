# Hierarchical Scene List UI Changes

## Overview

This document describes the changes made to improve the scene and chapter organization UI in the book editing interface. The changes implement a unified hierarchical view that better represents the reading order of the book.

## Problem Statement

The previous implementation had two distinct interfaces:
1. "Book-level Scenes" section showing scenes not in any chapter
2. Separate collapsible sections for each chapter with their scenes

This separation made it difficult to understand the actual reading order of the book and made drag-and-drop operations between book-level and chapter scenes confusing.

## Solution

The new implementation displays chapters and book-level scenes in a **single unified list** sorted by rank, which represents the reading order of the final book. This matches the example structure:

```
scene 1
Chapter 1
  - scene 2
  - scene 3
Chapter 2
  - scene 4
scene 5
scene 6
Chapter 3
```

## Technical Changes

### 1. Data Structure (`islands/HierarchicalSceneList.tsx`)

Added a `ListItem` union type to represent items in the unified list:

```typescript
type ListItem = 
  | { type: 'scene'; scene: SceneItem }
  | { type: 'chapter'; chapter: ChapterItem; scenes: SceneItem[] };
```

### 2. Unified List Creation

The component now:
1. Combines all book-level scenes and chapters into a single array
2. Sorts by rank to get the correct reading order
3. Renders the list with proper visual hierarchy

```typescript
const unifiedList: ListItem[] = [];

// Add all book-level scenes
initialBookLevelScenes.forEach(scene => {
  unifiedList.push({ type: 'scene', scene });
});

// Add all chapters
initialChapters.forEach(({ chapter, scenes }) => {
  unifiedList.push({ type: 'chapter', chapter, scenes });
});

// Sort by rank to get the correct reading order
unifiedList.sort((a, b) => {
  const rankA = a.type === 'scene' ? a.scene.rank : a.chapter.rank;
  const rankB = b.type === 'scene' ? b.scene.rank : b.chapter.rank;
  return rankA.localeCompare(rankB);
});
```

### 3. Visual Design Improvements

#### Chapter Styling
- **Left border**: `border-l-2 border-base-300` provides visual grouping
- **Book icon**: 📖 emoji helps identify chapters quickly
- **Bold font**: Chapter titles are displayed in bold
- **Badge**: Shows count of scenes in the chapter

#### Scene Nesting
- Scenes within chapters are indented with `ml-4` (1rem / 16px)
- Book-level scenes have no indentation
- Active scenes are highlighted with primary color background

#### Drop Zones
- Dashed border styling: `border-2 border-dashed`
- Highlight on drag over: `border-primary bg-primary/10`
- Clear visual feedback for where scenes will be dropped

### 4. Drag and Drop

The drag and drop functionality remains intact:
- Scenes can be dragged between chapters and book-level
- Scenes can be reordered within chapters
- Drop zones are provided at the end of each chapter
- The existing move API endpoint handles all positioning logic

### 5. Chapter Rank Support

Updated the book detail page to pass chapter rank information:

```typescript
const chaptersWithScenes = chapters.map((chapter) => ({
  chapter: { id: chapter.id, title: chapter.title, rank: chapter.rank },
  scenes: (scenesByChapter.get(chapter.id) ?? []).map((s) => ({
    id: s.id,
    title: s.derived?.title || `Scene ${s.id.slice(0, 6)}`,
    rank: s.rank,
    chapterId: s.chapterId,
  })),
}));
```

## User Experience Improvements

1. **Clearer Reading Order**: Users can now see the exact sequence of scenes and chapters as they will appear in the final book
2. **Better Visual Hierarchy**: Nesting and borders make the structure immediately clear
3. **Simplified Interface**: One unified list instead of separate sections
4. **Consistent Drag and Drop**: Moving scenes between chapters and book-level feels more natural

## Files Modified

1. **islands/HierarchicalSceneList.tsx** - Main component implementation
   - Added unified list logic
   - Updated visual styling
   - Improved drop zone rendering
   
2. **routes/series/[seriesId]/books/[bookId].tsx** - Added chapter rank to props
   - Updated chapter data structure to include rank

## Backward Compatibility

- No changes to the data model or API
- Existing scenes and chapters work without migration
- The move API endpoint remains unchanged
- All existing functionality is preserved

## Future Enhancements

Potential improvements for future iterations:

1. **Chapter Reordering**: Add drag and drop support for reordering chapters themselves
2. **Keyboard Navigation**: Add keyboard shortcuts for navigating the hierarchy
3. **Collapse All/Expand All**: Add buttons to collapse or expand all chapters at once
4. **Visual Indicators**: Add numbering or other visual indicators for scene order
5. **Bulk Operations**: Add ability to select multiple scenes for moving

## Testing Recommendations

When testing this feature:

1. Create a book with multiple chapters and scenes
2. Test dragging scenes between chapters
3. Test dragging scenes from chapters to book-level and vice versa
4. Test the visual hierarchy with empty chapters
5. Verify that the reading order is clear at a glance
6. Test with long scene/chapter titles to ensure proper layout
