# Data Model: Fix Character Types Navigation

Entities

- CharacterType
  - id: string (UUID)
  - userId: number (owner GitHub id)
  - seriesId: string — the Series id this type is scoped to
  - name: string (required)
  - description: string (optional)
  - fields: array of { id: string, label: string, type: string, options?: any }
  - usageReferences: string[] — list of Series ids that reference this type
  - createdAt: number (unix ms)
  - updatedAt: number (unix ms)

- Series
  - id: string (UUID)
  - userId: number
  - title: string
  - createdAt, updatedAt

- User
  - id: number (GitHub id)
  - displayName: string

- NavigationState (transient, not persisted)
  - originRoute: string
  - originSeriesId?: string

Key/Validation Rules

- `CharacterType.name` required, max length 200
- `CharacterType.seriesId` is required; Character Types are Series-scoped
- `usageReferences` must only list valid `Series.id` values

KV Key Patterns (Deno KV)

- CharacterType: `['yawt','characterType', userId, seriesId, id]`
- Series: `['yawt','series', userId, id]`

Notes

- For this feature we assume Series-scoped types by default (`seriesId` required, non-null). This aligns with the existing `characterTypeKey(userId, seriesId, typeId)` helper in `utils/story/keys.ts`. Import/Copy operations create new CharacterType records under the target `seriesId` and update `usageReferences` accordingly.
