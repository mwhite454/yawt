```markdown
# Data Model: Fix Character Types Navigation

Entities

- CharacterType
  - id: string (UUID)
  - userId: number (owner GitHub id)
  - seriesId: string | null — the Series id this type is scoped to (null for global/user types)
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
- `CharacterType.seriesId` when non-null implies Series-scoped; when null implies global/user-scoped
- `usageReferences` must only list valid `Series.id` values

KV Key Patterns (Deno KV)

- CharacterType: `['yawt','characterType', userId, seriesId || 'global', id]`
- Series: `['yawt','series', userId, id]`

Notes

- For this feature we assume Series-scoped types by default (`seriesId` non-null). Import/Copy operations create new CharacterType records under the target `seriesId` and update `usageReferences` accordingly.

```
