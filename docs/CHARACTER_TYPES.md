# Character Types Feature

## Overview

Character Types allow users to define custom templates for characters in their series. Each character type contains a set of custom fields that can be used to collect specific information about characters of that type.

## Feature Description

### What Are Character Types?

Character Types are user-defined templates that allow authors to create structured schemas for different categories of characters. For example, you might create:

- **Lead Character** type with fields: gender identity (select), religion (select), skin tone (text), eye color (text), faults (list)
- **Supporting Character** type with different fields relevant to supporting roles
- **Villain** type with fields specific to antagonists

### Key Capabilities

1. **Custom Field Types**:
   - **Text**: Single-line text input
   - **Select**: Dropdown with predefined options
   - **List**: Multiple text values (array)

2. **Field Properties**:
   - Name (internal identifier)
   - Label (display name)
   - Type (text/select/list)
   - Required flag
   - Options (for select fields)

3. **Character Integration**:
   - Assign a character type when creating/editing a character
   - Form dynamically shows fields based on selected type
   - Type-specific data stored in `typeData` field
   - Display type badge and data on character cards

## Technical Implementation

### Data Model

#### CharacterType Interface
```typescript
interface FieldDefinition {
  name: string;
  label: string;
  type: "text" | "select" | "list";
  options?: string[];
  required?: boolean;
}

interface CharacterType {
  id: string;
  userId: UserId; // Type alias for number
  seriesId: string;
  name: string;
  description?: string;
  fields: FieldDefinition[];
  createdAt: number;
  updatedAt: number;
}
```

#### Character Interface Updates
```typescript
interface Character {
  // ... existing fields
  characterTypeId?: string;
  typeData?: Record<string, unknown>;
}
```

### Storage

- **KV Key Pattern**: `["yawt", "characterType", userId, seriesId, typeId]`
- Character types are scoped to a series
- Characters reference types via `characterTypeId`

### API Endpoints

#### Character Types
- `GET /api/series/{seriesId}/character-types` - List all types
- `POST /api/series/{seriesId}/character-types` - Create new type
- `GET /api/series/{seriesId}/character-types/{typeId}` - Get specific type
- `PUT /api/series/{seriesId}/character-types/{typeId}` - Update type
- `DELETE /api/series/{seriesId}/character-types/{typeId}` - Delete type (prevented if in use)

#### Character Updates
- Character POST/PUT endpoints now accept `characterTypeId` and `typeData`

### UI Components

#### Pages
1. `/series/{id}/character-types` - List all character types
2. `/series/{id}/character-types/new` - Create new character type
3. `/series/{id}/character-types/{typeId}` - Edit existing character type
4. `/series/{id}/characters` - Updated to show character type selector and data

#### Islands (Interactive Components)
1. **CharacterTypeEditor** - Manages character type creation/editing with field builder
2. **CharacterForm** - Enhanced character form with dynamic type-specific fields

## User Flow

### Creating a Character Type

1. Navigate to Characters page
2. Click "Manage Character Types"
3. Click "Create New Character Type"
4. Enter name and optional description
5. Add custom fields:
   - Click "Add Field"
   - Set field name, label, and type
   - For select fields, add dropdown options
   - Mark as required if needed
6. Click "Save Character Type"

### Using a Character Type

1. Navigate to Characters page
2. Fill in character name and description
3. Select a character type from dropdown
4. Form dynamically displays type-specific fields
5. Fill in the custom fields
6. Click "Add Character"
7. Character card shows type badge and displays type data

### Editing a Character Type

1. Navigate to Character Types page
2. Click "Edit" on a character type
3. Modify fields, add/remove fields
4. Click "Save Character Type"
5. Note: Existing characters keep their data even if field definitions change

### Deleting a Character Type

1. Navigate to Character Types page
2. Click "Edit" on a character type
3. Click "Delete"
4. If characters use this type, deletion is prevented with error message
5. Otherwise, type is deleted

## Safety Features

### Protection Against Data Loss

1. **Deletion Prevention**: Cannot delete a character type if any characters are using it
   - API returns error with list of affected characters
   
2. **Type Change Warning**: When changing a character's type, user gets confirmation dialog
   - Warns that type-specific data will be cleared
   - User can cancel to keep current type

### Known Limitations

1. **Field Schema Changes**: Renaming fields in a type doesn't migrate existing character data
2. **Required Fields**: `required` flag is defined but not enforced in current implementation
3. **Validation**: No strict validation of field values against schema
4. **Extra Data**: Characters can still use the `extra` field independently of type schema

## Future Enhancements

Potential improvements for future versions:

1. **Data Migration**: Tools to migrate data when field names change
2. **Required Field Validation**: Enforce required fields in character form
3. **Field Constraints**: Add validation rules (min/max length, regex patterns)
4. **Bulk Operations**: Ability to change multiple characters' types at once
5. **Type Templates**: Pre-defined character type templates for common use cases
6. **Field Ordering**: Drag-and-drop reordering of fields
7. **Conditional Fields**: Show/hide fields based on other field values
8. **Import/Export**: Share character type definitions between series

## Code Organization

### Modified Files
- `utils/story/types.ts` - Added CharacterType, FieldDefinition types, updated Character
- `utils/story/keys.ts` - Added characterTypeKey helper
- `routes/api/series/[seriesId]/character-types.ts` - API for list/create
- `routes/api/series/[seriesId]/character-types/[typeId].ts` - API for get/update/delete
- `routes/api/series/[seriesId]/characters.ts` - Updated to handle characterTypeId/typeData
- `routes/api/series/[seriesId]/characters/[characterId].ts` - Updated PUT handler

### New Files
- `routes/series/[seriesId]/character-types.tsx` - Character types list page
- `routes/series/[seriesId]/character-types/new.tsx` - Create character type page
- `routes/series/[seriesId]/character-types/[typeId].tsx` - Edit character type page
- `islands/CharacterTypeEditor.tsx` - Interactive type editor component
- `islands/CharacterForm.tsx` - Enhanced character creation/edit form
