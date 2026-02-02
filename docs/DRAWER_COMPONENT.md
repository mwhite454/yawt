# Sidebar Drawer Component

The `SidebarDrawer` component provides a context-aware sidebar that can display different tools and information based on the current route.

## Architecture

- **Component**: `islands/SidebarDrawer.tsx` - Interactive island component
- **Integration**: `components/Layout.tsx` - Wraps all page content
- **Pattern**: Uses daisyUI's drawer component with Preact signals for state

## Features

- Right-side sliding drawer (drawer-end)
- Toggle via hamburger menu button in navbar
- Click overlay to close
- Context-aware content via props
- Responsive design
- Accessible with ARIA labels

## Usage

### Basic Example

To add sidebar content to a page, pass the `sidebarContent` prop to the `Layout` component:

```tsx
import { Layout } from "@components/Layout.tsx";

export default function MyPage({ data }: PageProps<Data>) {
  const sidebarContent = (
    <div>
      <h3 class="font-semibold mb-2">My Tools</h3>
      <ul class="menu bg-base-200 rounded-box">
        <li><a href="/link1">Tool 1</a></li>
        <li><a href="/link2">Tool 2</a></li>
      </ul>
    </div>
  );

  return (
    <Layout user={data.user} sidebarContent={sidebarContent}>
      {/* Your page content */}
    </Layout>
  );
}
```

### Without Sidebar

If you don't pass `sidebarContent`, the drawer button won't appear:

```tsx
<Layout user={data.user}>
  {/* Your page content - no drawer */}
</Layout>
```

### Context-Aware Example

The series detail page (`routes/series/[seriesId]/index.tsx`) demonstrates context-aware sidebar content with:
- Quick navigation links
- Series information display
- Icons for better UX

## Styling

The drawer uses daisyUI classes:
- `drawer` and `drawer-end` - Main container
- `drawer-toggle` - Hidden checkbox for state
- `drawer-content` - Main page content
- `drawer-side` - Sidebar panel
- `drawer-overlay` - Click-to-close overlay
- `menu bg-base-100` - Sidebar styling
- `w-80` - 320px width (customizable)

## Component Props

### SidebarDrawer

```typescript
interface SidebarDrawerProps {
  children: ComponentChildren;      // Main page content
  sidebarContent?: ComponentChildren; // Optional sidebar content
}
```

### Layout

```typescript
export function Layout(props: {
  user: User | null;
  title?: string;
  children: ComponentChildren;
  sidebarContent?: ComponentChildren; // NEW: Optional sidebar content
})
```

## State Management

The component uses `@preact/signals` for reactive state:
- `isOpen` signal tracks drawer state
- `toggleDrawer()` function toggles the drawer
- Works with daisyUI's checkbox pattern

## Accessibility

- Hamburger button has `aria-label="Open sidebar"`
- Overlay has `aria-label="close sidebar"`
- Close button has `aria-label="Close drawer"`
- Keyboard accessible via label/checkbox pattern

## Future Enhancements

Possible improvements:
- Add keyboard shortcuts (e.g., `Ctrl+/` to toggle)
- Support left-side drawer option
- Add drawer width customization prop
- Persist drawer state in localStorage
- Add animation/transition customization
