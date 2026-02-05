# Chapter Implementation

## Overview

Chapters have been added to provide additional structure between Books and Scenes. Users can now:
- Create chapters within a book
- Organize scenes into chapters
- Keep scenes at the book level (without a chapter)

## Data Model

### Chapter Type
```typescript
interface Chapter {
  id: string;
  userId: UserId;
  seriesId: string;
  bookId: string;
  rank: string;           // For ordering chapters
  title: string;
  description?: string;   // Optional chapter description
  createdAt: number;
  updatedAt: number;
}
```

### Scene Type (Updated)
```typescript
interface Scene {
  id: string;
  userId: UserId;
  seriesId: string;
  bookId: string;
  chapterId?: string;     // Optional - scenes can be in a chapter or at book level
  rank: string;
  text: string;
  derived: SceneDerived;
  createdAt: number;
  updatedAt: number;
}
```

## Storage

Chapters use the same rank-based ordering system as Books and Scenes:

- Chapter data: `["yawt", "chapter", userId, seriesId, bookId, chapterId]`
- Chapter order: `["yawt", "chapterOrder", userId, seriesId, bookId, rank, chapterId]`
- Scene order (in chapter): `["yawt", "sceneOrder", userId, seriesId, bookId, chapterId, rank, sceneId]`
- Scene order (book level): `["yawt", "sceneOrder", userId, seriesId, bookId, rank, sceneId]`

This design minimizes storage overhead as:
- Only one additional field (chapterId) is added to scenes
- Scenes without a chapter work exactly as before
- No additional indices or lookups are needed

## API Endpoints

### Chapters
- `GET /api/series/[seriesId]/books/[bookId]/chapters` - List all chapters in a book
- `POST /api/series/[seriesId]/books/[bookId]/chapters` - Create a new chapter
- `GET /api/series/[seriesId]/books/[bookId]/chapters/[chapterId]` - Get chapter details
- `PUT /api/series/[seriesId]/books/[bookId]/chapters/[chapterId]` - Update chapter
- `DELETE /api/series/[seriesId]/books/[bookId]/chapters/[chapterId]` - Delete chapter (must be empty)

### Scenes in Chapters
- `GET /api/series/[seriesId]/books/[bookId]/chapters/[chapterId]/scenes` - List scenes in a chapter
- `POST /api/series/[seriesId]/books/[bookId]/chapters/[chapterId]/scenes` - Create scene in a chapter

### Existing Scene Endpoints (Updated)
- Scene endpoints now handle optional chapterId
- Scene deletion properly removes from chapter or book-level ordering
- Scene reordering maintains chapter assignment

## UI Changes

The book detail page now displays:
1. A hierarchical view with chapters as collapsible sections
2. Book-level scenes shown separately
3. Forms to create chapters or book-level scenes
4. Forms to add scenes within each chapter
5. Scene counts for each chapter

## Performance

The implementation minimizes storage and performance impact:
- Scenes can be fetched with the same query patterns as before
- Chapter lookup adds minimal overhead (one additional KV read per chapter)
- Scene ordering uses the same fractional ranking system
- No migration needed for existing data (scenes without chapterId work as before)

## Future Enhancements

Possible improvements:
- Reordering chapters via drag-and-drop
- Moving scenes between chapters
- Chapter templates
- Chapter-level metadata (tags, dates, etc.)
- Bulk operations on chapter scenes
