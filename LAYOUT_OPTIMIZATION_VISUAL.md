# Layout Optimization - Visual Examples

## Responsive Breakpoint Behavior

This document illustrates how the layout adapts across different screen sizes.

## Main Content Container Width by Breakpoint

```
Mobile (< 640px):
┌────────────────────────────────────┐
│ Full Width (100%)                  │
│ Padding: 0.5rem (8px)              │
└────────────────────────────────────┘

Small (640px - 767px):
┌────────────────────────────────────┐
│ Full Width (100%)                  │
│ Padding: 1rem (16px)               │
└────────────────────────────────────┘

Medium (768px - 1023px):
┌─────────────────────────────────────────┐
│        Max Width: 1152px                │
│        Padding: 1.5rem (24px)           │
│  ┌─────────────────────────────────┐   │
│  │         Content Area            │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘

Large (1024px - 1279px):
┌────────────────────────────────────────────┐
│         Max Width: 1280px                  │
│         Padding: 2rem (32px)               │
│  ┌────────────────────────────────────┐   │
│  │         Content Area               │   │
│  └────────────────────────────────────┘   │
└────────────────────────────────────────────┘

Extra Large (1280px - 1535px):
┌───────────────────────────────────────────────────┐
│            Max Width: 1600px                      │
│            Padding: 2rem (32px)                   │
│  ┌───────────────────────────────────────────┐   │
│  │            Content Area                   │   │
│  └───────────────────────────────────────────┘   │
└───────────────────────────────────────────────────┘

2XL (1536px+):
┌──────────────────────────────────────────────────────────┐
│              Max Width: 1920px                           │
│              Padding: 2rem (32px)                        │
│  ┌──────────────────────────────────────────────────┐   │
│  │              Content Area                        │   │
│  └──────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

## Grid Column Behavior Examples

### Books Grid (Series Detail Page)

#### Medium Screens (768px+)
```
┌─────────┐ ┌─────────┐
│ Book 1  │ │ Book 2  │
└─────────┘ └─────────┘
┌─────────┐ ┌─────────┐
│ Book 3  │ │ Book 4  │
└─────────┘ └─────────┘
```
**2 columns** - Classic grid layout

#### Large Screens (1024px+)
```
┌─────────┐ ┌─────────┐ ┌─────────┐
│ Book 1  │ │ Book 2  │ │ Book 3  │
└─────────┘ └─────────┘ └─────────┘
┌─────────┐ ┌─────────┐ ┌─────────┐
│ Book 4  │ │ Book 5  │ │ Book 6  │
└─────────┘ └─────────┘ └─────────┘
```
**3 columns** - Better space utilization

#### Extra Large Screens (1280px+)
```
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│ Book 1  │ │ Book 2  │ │ Book 3  │ │ Book 4  │
└─────────┘ └─────────┘ └─────────┘ └─────────┘
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│ Book 5  │ │ Book 6  │ │ Book 7  │ │ Book 8  │
└─────────┘ └─────────┘ └─────────┘ └─────────┘
```
**4 columns** - Optimal for desktop monitors

#### 2XL Screens (1536px+)
```
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│ Book 1  │ │ Book 2  │ │ Book 3  │ │ Book 4  │ │ Book 5  │
└─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│ Book 6  │ │ Book 7  │ │ Book 8  │ │ Book 9  │ │ Book 10 │
└─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘
```
**5 columns** - Maximum utilization for ultra-wide displays

### Characters, Locations, Timelines Grids

#### Medium Screens (768px+)
```
┌───────────────┐ ┌───────────────┐
│  Character 1  │ │  Character 2  │
│               │ │               │
└───────────────┘ └───────────────┘
```
**2 columns**

#### Large Screens (1024px+)
```
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│  Character 1  │ │  Character 2  │ │  Character 3  │
│               │ │               │ │               │
└───────────────┘ └───────────────┘ └───────────────┘
```
**3 columns**

#### Extra Large Screens (1280px+)
```
┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│  Character 1  │ │  Character 2  │ │  Character 3  │ │  Character 4  │
│               │ │               │ │               │ │               │
└───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘
```
**4 columns**

## Book Detail Page - Sidebar Layout

### Large Screens (1024px+)
```
┌──────────────────────────────────────────────────────┐
│  ┌──────────────┐  ┌──────────────────────────────┐ │
│  │   Sidebar    │  │       Main Content           │ │
│  │   (33%)      │  │       (67%)                  │ │
│  │              │  │                              │ │
│  │  Structure   │  │  Scene Editor & Preview      │ │
│  │  - Chapters  │  │                              │ │
│  │  - Scenes    │  │                              │ │
│  │              │  │                              │ │
│  └──────────────┘  └──────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
        4 cols              8 cols
```

### Extra Large Screens (1280px+)
```
┌────────────────────────────────────────────────────────────┐
│ ┌──────────┐  ┌───────────────────────────────────────┐  │
│ │ Sidebar  │  │        Main Content                   │  │
│ │  (25%)   │  │        (75%)                          │  │
│ │          │  │                                       │  │
│ │Structure │  │  More space for Scene Editor          │  │
│ │- Chapt.  │  │  & Preview                            │  │
│ │- Scenes  │  │                                       │  │
│ │          │  │                                       │  │
│ └──────────┘  └───────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
     3 cols                  9 cols
```

## Information Density Comparison

### Before Optimization (Fixed at 1152px max)
- **1920px screen**: ~768px of unused space (40% wasted)
- **1440px screen**: ~288px of unused space (20% wasted)
- **Books visible**: 3 per row maximum
- **Characters visible**: 2 per row maximum

### After Optimization
- **1920px screen**: Content uses up to 1920px (0% wasted)
- **1440px screen**: Content uses up to 1440px (0% wasted)
- **Books visible**: Up to 5 per row on 2xl screens
- **Characters visible**: Up to 4 per row on xl screens

## Key Benefits

1. **66% more book covers** visible on ultra-wide displays (3 → 5)
2. **100% more characters/locations** visible on large displays (2 → 4)
3. **25% more editing space** in book detail view (67% → 75%)
4. **Zero dead space** on any screen size
5. **Improved visual hierarchy** with graduated padding

## Responsive Padding Scale

```
Mobile:   p-2  (0.5rem / 8px)
Small:    p-4  (1rem / 16px)
Medium:   p-6  (1.5rem / 24px)
Large:    p-8  (2rem / 32px)
```

This creates comfortable breathing room that scales with screen size.
