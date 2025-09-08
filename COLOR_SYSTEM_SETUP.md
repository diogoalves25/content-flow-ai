# Color System Setup - Preventing Text Visibility Issues

This document outlines how to properly set up a color system in Next.js projects using Tailwind CSS to prevent text visibility and contrast issues.

## The Problem

When using Tailwind CSS with semantic color classes like `text-muted-foreground`, `bg-muted`, `border-input`, etc., these classes must be properly defined in your color system. Without proper definitions, text can become invisible or have very poor contrast, especially in different color schemes or browsers.

## Root Cause

The issue occurs when:
1. Components use semantic Tailwind classes (e.g., `text-muted-foreground`)
2. These classes are not properly defined in the CSS variables
3. The browser falls back to default values or renders invisible text

## The Solution

### 1. Complete CSS Variables Definition (globals.css)

Define all semantic color variables using HSL values for better color manipulation:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 224 71.4% 4.1%;
  --card: 0 0% 100%;
  --card-foreground: 224 71.4% 4.1%;
  --popover: 0 0% 100%;
  --popover-foreground: 224 71.4% 4.1%;
  --primary: 262.1 83.3% 57.8%;
  --primary-foreground: 210 20% 98%;
  --secondary: 220 14.3% 95.9%;
  --secondary-foreground: 220.9 39.3% 11%;
  --muted: 220 14.3% 95.9%;
  --muted-foreground: 220 8.9% 46.1%;
  --accent: 220 14.3% 95.9%;
  --accent-foreground: 220.9 39.3% 11%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 20% 98%;
  --border: 220 13% 91%;
  --input: 220 13% 91%;
  --ring: 262.1 83.3% 57.8%;
  --radius: 0.5rem;
}
```

### 2. Proper Dark Mode Support

```css
@media (prefers-color-scheme: dark) {
  :root {
    --background: 224 71.4% 4.1%;
    --foreground: 210 20% 98%;
    /* ... other dark mode colors */
  }
}
```

### 3. Tailwind Config Integration (tailwind.config.ts)

```typescript
export default {
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        // ... other colors
      },
    },
  },
}
```

### 4. Base Layer Styles for Guaranteed Contrast

```css
@layer base {
  * {
    @apply border-border;
  }
  
  body {
    @apply bg-background text-foreground;
  }
  
  h1, h2, h3, h4, h5, h6 {
    @apply text-foreground;
  }
  
  p, span, div, label {
    @apply text-foreground;
  }
  
  .text-muted-foreground {
    color: hsl(var(--muted-foreground)) !important;
  }
}
```

## Prevention Checklist for Future Projects

- [ ] Create complete CSS variables in `globals.css` for all semantic colors
- [ ] Set up proper `tailwind.config.ts` with color mappings
- [ ] Include dark mode support in CSS variables
- [ ] Add base layer styles for text elements
- [ ] Test text visibility in both light and dark modes
- [ ] Verify all `text-*-foreground` classes are properly defined
- [ ] Use HSL color format for better color manipulation

## Common Semantic Classes to Define

Always ensure these classes are properly defined:
- `text-foreground`
- `text-muted-foreground`
- `text-card-foreground`
- `text-popover-foreground`
- `text-primary-foreground`
- `text-secondary-foreground`
- `text-accent-foreground`
- `text-destructive-foreground`
- `bg-background`
- `bg-card`
- `bg-muted`
- `border-border`
- `border-input`

## Testing

Before deployment, always:
1. Test in light mode
2. Test in dark mode
3. Test with browser zoom at 150%+
4. Check text contrast using accessibility tools
5. Verify readability on different screen sizes

This setup ensures that text will always be visible and have proper contrast across all themes and devices.