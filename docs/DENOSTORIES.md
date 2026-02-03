# Denostories Guide for YAWT

This project uses [Denostories](https://github.com/CAYdenberg/denostories) for component development and documentation.

## What is Denostories?

Denostories is a Storybook-like implementation for the Fresh framework. It allows you to:
- Develop components in isolation
- Document component usage and variations
- Automatically test that components render without errors
- View all components in one place during development

## Accessing Stories

Once the development server is running (`deno task start`), visit:
```
http://localhost:8000/stories/
```

This will show a catalog of all available stories organized by component.

## Creating Story Files

All reusable components and islands **must** include a story file.

### File Location and Naming

Story files should be placed in a `__stories__` directory alongside the component they document:

```
components/
  __stories__/
    MyComponent.stories.tsx
  MyComponent.tsx

islands/
  __stories__/
    MyIsland.stories.tsx
  MyIsland.tsx
```

### Story File Structure

A story file exports one or more story functions. Each export becomes a separate story in the UI:

```tsx
import { MyComponent } from "../MyComponent.tsx";

// Each export is a story
export const Default = () => <MyComponent />;

export const WithProps = () => (
  <MyComponent title="Example" description="This is an example" />
);

export const Loading = () => <MyComponent isLoading={true} />;
```

### Best Practices

1. **Show Different States**: Create stories for different component states (empty, loading, error, success, etc.)

2. **Use Realistic Data**: Create mock data that resembles real data structure:
   ```tsx
   const mockUser: User = {
     id: 12345,
     login: "testuser",
     name: "Test User",
     // ... other required fields
   };
   ```

3. **Add Context**: Wrap stories in containers when needed for styling:
   ```tsx
   export const Example = () => (
     <div class="p-4">
       <MyComponent />
     </div>
   );
   ```

4. **Name Stories Clearly**: Use descriptive names that explain what the story demonstrates:
   - ✅ `LoggedInWithSeries`
   - ✅ `EmptyList`
   - ✅ `WithValidationError`
   - ❌ `Test1`
   - ❌ `Story`

5. **Document Edge Cases**: Include stories for edge cases and unusual states

### Interactive Islands

For islands (interactive components), you can use event handlers:

```tsx
export const WithInteraction = () => (
  <MyIsland
    onSubmit={(data) => console.log("Submitted:", data)}
    onChange={(value) => console.log("Changed:", value)}
  />
);
```

### Type-Safe Stories

You can use the `Story` type from denostories for type safety:

```tsx
import type { Story } from "https://deno.land/x/denostories@0.3.0/mod.ts";

export const Example: Story = () => <MyComponent />;

// You can also add data checks
Example.checkData = {
  "testAttr": (value) => assertEquals(value, "expected"),
};
```

## Examples

Check these existing story files for examples:
- `components/__stories__/Layout.stories.tsx` - Complex component with multiple variations
- `components/__stories__/SeriesDropdown.stories.tsx` - Simple component with different states
- `islands/__stories__/DraggableList.stories.tsx` - Interactive component with event handlers
- `islands/__stories__/ThemeController.stories.tsx` - Island with different configurations

## Automatic Checks

Denostories automatically renders all stories on startup to check for errors. If a story fails to render:
- You'll see an error in the terminal
- An indicator will appear on the `/stories` page
- The build will fail in CI/CD

This helps catch rendering issues early!

## Configuration

The denostories plugin is configured in `fresh.config.ts`:

```tsx
import denostories from "https://deno.land/x/denostories@0.3.0/mod.ts";

export default {
  plugins: [
    denostories(),
  ],
} as FreshConfig;
```

Default configuration:
- **Route**: `/stories` (visit this URL to see stories)
- **Pattern**: `**/*.stories.tsx` (all files ending in `.stories.tsx`)
- **Headless Checks**: Enabled (automatically tests stories)
- **Exit on Failed Check**: Enabled (build fails if stories don't render)

## Tips

1. **Hot Reload**: Stories support hot reload - edit a story file and see changes immediately
2. **Parallel Development**: Use stories to develop components without running the full app
3. **Quick Testing**: Verify visual changes across all component variations at once
4. **Documentation**: Stories serve as living documentation for component usage

## Troubleshooting

**Story not showing up?**
- Ensure file ends with `.stories.tsx`
- Check that functions are exported (not default export)
- Restart the dev server

**Story fails to render?**
- Check browser console and terminal for errors
- Verify all imported types and utilities are available
- Ensure mock data matches required type structure

**Interactive features not working?**
- Islands must be in the `islands/` directory to hydrate on client
- Check that event handlers are properly connected
