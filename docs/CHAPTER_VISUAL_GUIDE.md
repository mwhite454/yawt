# Chapter Feature - Visual Guide

## Data Model Hierarchy

```
Series
  └── Book 1
      ├── Chapter 1
      │   ├── Scene 1.1
      │   ├── Scene 1.2
      │   └── Scene 1.3
      ├── Chapter 2
      │   ├── Scene 2.1
      │   └── Scene 2.2
      └── Scene A (book-level, no chapter)
      └── Scene B (book-level, no chapter)
```

## KV Key Structure

### Chapter Keys
```
["yawt", "chapter", userId, seriesId, bookId, chapterId]
["yawt", "chapterOrder", userId, seriesId, bookId, rank, chapterId]
```

### Scene Keys (Updated)

**Book-level scenes (7 parts):**
```
["yawt", "scene", userId, seriesId, bookId, sceneId]
["yawt", "sceneOrder", userId, seriesId, bookId, rank, sceneId]
```

**Chapter scenes (8 parts):**
```
["yawt", "scene", userId, seriesId, bookId, sceneId]
["yawt", "sceneOrder", userId, seriesId, bookId, chapterId, rank, sceneId]
```

## API Flow Examples

### Creating a Chapter
```
POST /api/series/{seriesId}/books/{bookId}/chapters
Body: { "title": "Chapter 1", "description": "Introduction" }

Response: {
  "chapter": {
    "id": "uuid",
    "title": "Chapter 1",
    "rank": "V",
    ...
  }
}
```

### Creating a Scene in a Chapter
```
POST /api/series/{seriesId}/books/{bookId}/chapters/{chapterId}/scenes
Body: { "text": "---\ntitle: Opening Scene\n---\n\nText content..." }

Response: {
  "scene": {
    "id": "uuid",
    "chapterId": "chapter-uuid",
    "text": "...",
    ...
  }
}
```

### Creating a Book-level Scene
```
POST /api/series/{seriesId}/books/{bookId}/scenes
Body: { "text": "---\ntitle: Prologue\n---\n\nText content..." }

Response: {
  "scene": {
    "id": "uuid",
    "chapterId": undefined,  // No chapter
    "text": "...",
    ...
  }
}
```

## UI Layout

```
┌────────────────────────────────────────────────────────────────┐
│ Structure                                    │ Editor          │
│                                              │                 │
│ [New ▼]                                      │ Scene Title     │
│  ├─ Create Chapter                           │                 │
│  └─ Create Scene (Book Level)                │ ┌─────────────┐│
│                                              │ │             ││
│ ── Book-level Scenes ──                      │ │   Textarea  ││
│ • Scene A                                    │ │   for       ││
│ • Scene B                                    │ │   editing   ││
│                                              │ │             ││
│ ⯆ Chapter 1                          [3]     │ └─────────────┘│
│   [+ New scene]                              │                 │
│   • Scene 1.1                                │ [Save]          │
│   • Scene 1.2                                │                 │
│   • Scene 1.3                                │                 │
│                                              │                 │
│ ⯆ Chapter 2                          [2]     │                 │
│   [+ New scene]                              │                 │
│   • Scene 2.1                                │                 │
│   • Scene 2.2                                │                 │
└────────────────────────────────────────────────────────────────┘
```

## Query Patterns

### Get All Chapters in a Book
```typescript
const entries = kv.list({
  prefix: ["yawt", "chapterOrder", userId, seriesId, bookId]
});
// Returns chapters in rank order
```

### Get Book-level Scenes Only
```typescript
const entries = kv.list({
  prefix: ["yawt", "sceneOrder", userId, seriesId, bookId]
});
// Filter keys with length === 7 (book-level)
```

### Get Scenes in a Chapter
```typescript
const entries = kv.list({
  prefix: ["yawt", "sceneOrder", userId, seriesId, bookId, chapterId]
});
// Returns scenes in this chapter in rank order
```

## Migration Strategy

**Good News: No Migration Needed!**

Existing scenes automatically work as book-level scenes because:
1. Scene type has optional `chapterId` (undefined for existing scenes)
2. Existing scene order keys have 7 parts (book-level format)
3. UI handles scenes without chapters gracefully
4. API endpoints maintain backward compatibility

## Performance Characteristics

| Operation | Complexity | Notes |
|-----------|-----------|-------|
| List chapters | O(n) | n = number of chapters, KV prefix scan |
| List chapter scenes | O(n) | n = number of scenes in chapter, KV prefix scan |
| List book scenes | O(n) | n = number of book-level scenes, filtered prefix scan |
| Create chapter | O(1) | Single atomic write |
| Create scene | O(1) | Single atomic write |
| Reorder chapter | O(1) | Atomic delete + set with new rank |
| Delete chapter | O(1) | If empty, single atomic delete |

All operations use the same efficient fractional ranking system as books and scenes.
