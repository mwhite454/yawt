# Character Types - Quick Start Guide

## Creating Your First Character Type

This guide will walk you through creating a "Lead Character" type as described
in the feature requirements.

### Step 1: Navigate to Character Types

1. Go to your series page
2. Click on "Characters" in the navigation
3. Click "Manage Character Types" button

### Step 2: Create a New Character Type

1. Click "Create New Character Type"
2. Fill in the basic information:
   - **Name**: `Lead Character`
   - **Description**: `Main characters with detailed background information`

### Step 3: Define Custom Fields

Click "Add Field" for each field you want to add:

#### Field 1: Gender Identity (Select)

- **Field Name**: `gender_identity`
- **Label**: `Gender Identity`
- **Type**: `Select (dropdown)`
- **Required**: ✓
- **Options**:
  - Male
  - Female
  - Non-binary
  - Prefer not to say
  - Other

#### Field 2: Religion (Select)

- **Field Name**: `religion`
- **Label**: `Religion`
- **Type**: `Select (dropdown)`
- **Options**:
  - Christianity
  - Islam
  - Judaism
  - Buddhism
  - Hinduism
  - Atheist
  - Agnostic
  - Other
  - Prefer not to say

#### Field 3: Skin Tone (Text)

- **Field Name**: `skin_tone`
- **Label**: `Skin Tone`
- **Type**: `Text`

#### Field 4: Eye Color (Text)

- **Field Name**: `eye_color`
- **Label**: `Eye Color`
- **Type**: `Text`

#### Field 5: Faults (List)

- **Field Name**: `faults`
- **Label**: `Character Faults`
- **Type**: `List (multiple values)`
- **Description**: Add multiple items to list character flaws and weaknesses

### Step 4: Save the Character Type

Click "Save Character Type" to create it.

## Using Your Character Type

### Creating a New Character with the Type

1. Go to the Characters page
2. Fill in the character's name: e.g., `Jane Doe`
3. Add a description: e.g., `Protagonist and main character`
4. Select **Character Type**: `Lead Character`
5. The form will expand to show your custom fields:
   - **Gender Identity**: Select from dropdown
   - **Religion**: Select from dropdown
   - **Skin Tone**: Enter text (e.g., "Fair", "Olive", "Deep brown")
   - **Eye Color**: Enter text (e.g., "Blue", "Brown", "Green")
   - **Character Faults**: Click "Add Item" for each fault
     - Click to add: "Impulsive"
     - Click to add: "Overly trusting"
     - Click to add: "Fear of heights"
6. Click "Add Character"

### Viewing Character Type Data

After creating the character, you'll see:

- A badge showing "Lead Character" below the character's name
- A section displaying all the type-specific data you entered
- The data is organized and easy to read

## Tips

- **Plan Your Types**: Think about what information is essential for each
  character category
- **Use Consistent Names**: Keep field names lowercase with underscores (e.g.,
  `eye_color`)
- **Select vs. Text**: Use select fields when you have a fixed set of options,
  text for free-form input
- **Lists for Multiple Values**: Perfect for traits, skills, relationships, or
  any repeating data
- **Don't Over-Complicate**: Start with essential fields, you can always create
  more character types

## Example Character Types

Here are some other character type ideas:

### Supporting Character

- **role**: (select) Friend, Mentor, Sidekick, Love Interest
- **loyalty**: (select) Protagonist, Antagonist, Neutral, Variable
- **skills**: (list) Special abilities or talents
- **relationship_to_protagonist**: (text)

### Villain

- **motivation**: (text) Why are they antagonistic?
- **moral_alignment**: (select) Lawful Evil, Neutral Evil, Chaotic Evil
- **power_level**: (select) Minor Threat, Major Threat, World-Ending
- **weaknesses**: (list) Exploitable flaws
- **goals**: (list) What they're trying to achieve

### Minor Character

- **occupation**: (text)
- **appearances**: (list) Which chapters/scenes they appear in
- **purpose**: (text) Why this character exists in the story

## Advanced Usage

### Editing Character Types

You can edit character types at any time:

1. Go to Character Types page
2. Click "Edit" on any type
3. Add, remove, or modify fields
4. Click "Save Character Type"

**Note**: Existing characters will keep their data even if you rename or remove
fields. However, the data may not display correctly if the field definition is
removed.

### Deleting Character Types

To delete a character type:

1. Go to Character Types page
2. Click "Edit" on the type
3. Click "Delete"

**Important**: You cannot delete a character type if any characters are using
it. You must first change or delete those characters.

### Changing a Character's Type

1. Navigate to the Characters page
2. You'll need to use the API or edit the character through the character form
3. When changing types, you'll be warned that type-specific data will be cleared
4. Confirm to proceed or cancel to keep the current type

## Troubleshooting

### Can't Delete a Character Type

- **Problem**: You get an error when trying to delete
- **Solution**: Some characters are using this type. The error will list which
  characters need to be updated first.

### Lost Data When Changing Types

- **Problem**: Data disappeared after changing a character's type
- **Solution**: This is expected behavior. The system warns you before clearing
  data. To preserve data, don't change the character type.

### Field Not Showing

- **Problem**: Added a field to a character type but it doesn't show
- **Solution**: Refresh the page. The character form loads type information when
  the page loads.

## API Usage

For programmatic access, you can use the REST API:

```bash
# List character types
GET /api/series/{seriesId}/character-types

# Create character type
POST /api/series/{seriesId}/character-types
{
  "name": "Lead Character",
  "description": "Main characters",
  "fields": [
    {
      "name": "gender_identity",
      "label": "Gender Identity",
      "type": "select",
      "required": true,
      "options": ["Male", "Female", "Non-binary", "Other"]
    }
  ]
}

# Create character with type
POST /api/series/{seriesId}/characters
{
  "name": "Jane Doe",
  "description": "Protagonist",
  "characterTypeId": "uuid-of-character-type",
  "typeData": {
    "gender_identity": "Female",
    "eye_color": "Blue",
    "faults": ["Impulsive", "Overly trusting"]
  }
}
```

See `docs/CHARACTER_TYPES.md` for full API documentation.
