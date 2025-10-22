
# Theme System Documentation

**Last Updated**: January 22, 2025  
**Status**: Complete  
**Owner**: Development Team

---

## Overview

The application uses a comprehensive design system built on CSS custom properties (variables) that automatically adapts to light and dark modes. This ensures consistent theming across all components while maintaining accessibility standards.

---

## Color System

### Primary Colors

Our primary color palette is based on a blue scale that represents trust and professionalism:

```css
--primary: 221 83% 53%;        /* Primary blue */
--primary-foreground: 210 40% 98%; /* Text on primary */
```

**Usage**: Primary actions, brand elements, links, and key interactive components.

### Surface Colors

Background and surface colors create hierarchy and depth:

```css
/* Light Mode */
--background: 0 0% 100%;       /* Pure white */
--foreground: 222.2 84% 4.9%;  /* Almost black */
--card: 0 0% 100%;             /* Card background */
--popover: 0 0% 100%;          /* Popover background */

/* Dark Mode */
--background: 222.2 84% 4.9%;  /* Dark background */
--foreground: 210 40% 98%;     /* Light text */
--card: 222.2 84% 4.9%;        /* Card background */
--popover: 222.2 84% 4.9%;     /* Popover background */
```

### Semantic Colors

Colors with specific meanings for user feedback:

```css
--destructive: 0 84.2% 60.2%;  /* Error/delete red */
--success: 142 76% 36%;         /* Success green */
--warning: 38 92% 50%;          /* Warning orange */
--info: 199 89% 48%;            /* Info blue */
```

### Neutral Colors

Muted and accent colors for secondary elements:

```css
--muted: 210 40% 96.1%;        /* Muted backgrounds */
--muted-foreground: 215.4 16.3% 46.9%; /* Muted text */
--accent: 210 40% 96.1%;       /* Accent color */
--accent-foreground: 222.2 47.4% 11.2%; /* Text on accent */
```

### Border & Input Colors

```css
--border: 214.3 31.8% 91.4%;   /* Standard borders */
--input: 214.3 31.8% 91.4%;    /* Input borders */
--ring: 221 83% 53%;            /* Focus ring */
```

---

## Typography Scale

### Font Families

```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
```

For Arabic text, we use Noto Sans Arabic for proper RTL rendering.

### Type Scale

| Class | Size | Usage |
|-------|------|-------|
| `text-xs` | 12px / 0.75rem | Captions, labels |
| `text-sm` | 14px / 0.875rem | Secondary text, form labels |
| `text-base` | 16px / 1rem | Body text (default) |
| `text-lg` | 18px / 1.125rem | Large body text |
| `text-xl` | 20px / 1.25rem | H4 headings |
| `text-2xl` | 24px / 1.5rem | H3 headings |
| `text-3xl` | 30px / 1.875rem | H2 headings |
| `text-4xl` | 36px / 2.25rem | H1 headings |

### Mobile Typography

Special mobile-optimized sizes for better readability on small screens:

```css
.text-mobile-xs { font-size: 0.8125rem; }   /* 13px */
.text-mobile-sm { font-size: 0.875rem; }    /* 14px */
.text-mobile-base { font-size: 1rem; }      /* 16px */
.text-mobile-lg { font-size: 1.125rem; }    /* 18px */
.text-mobile-xl { font-size: 1.25rem; }     /* 20px */
```

---

## Spacing System

Our spacing system is based on a 4px (0.25rem) grid:

| Value | Pixels | Rem | Common Usage |
|-------|--------|-----|--------------|
| 1 | 4px | 0.25rem | Tight spacing |
| 2 | 8px | 0.5rem | Compact layouts |
| 3 | 12px | 0.75rem | Form spacing |
| 4 | 16px | 1rem | Standard spacing |
| 6 | 24px | 1.5rem | Section spacing |
| 8 | 32px | 2rem | Large spacing |
| 12 | 48px | 3rem | Extra large spacing |
| 16 | 64px | 4rem | Page sections |

**Mobile considerations**: On mobile, we generally reduce spacing by 25-50% for better space utilization.

---

## Component Patterns

### Buttons

All buttons follow the minimum touch target size of 44x44px on mobile:

```tsx
<Button className="min-h-[44px]">Touch-friendly</Button>
```

**Variants**:
- `default`: Primary blue background
- `secondary`: Muted background
- `outline`: Border only
- `ghost`: Transparent with hover
- `destructive`: Red for dangerous actions

### Cards

Cards use the `--card` background with proper elevation:

```tsx
<Card className="shadow-sm hover:shadow-md transition-shadow">
  {/* Content */}
</Card>
```

### Forms

Form inputs maintain consistent styling with proper focus states:

```tsx
<Input className="focus-visible:ring-2 focus-visible:ring-ring" />
```

---

## Dark Mode Implementation

Dark mode is toggled using the `dark` class on the root element:

```html
<html class="dark">
```

All color variables automatically switch between light and dark values when this class is present.

### Testing Dark Mode

To test dark mode:
1. Click the theme toggle in the navigation
2. Or use system preferences
3. State persists in localStorage

---

## Mobile-First Considerations

### Touch Targets

Minimum size: **44x44px** (WCAG AAA standard)

```css
.touch-target-large {
  min-width: 44px;
  min-height: 44px;
}
```

### Safe Areas

For devices with notches (iPhone X+):

```css
.safe-top { padding-top: env(safe-area-inset-top); }
.safe-bottom { padding-bottom: env(safe-area-inset-bottom); }
.safe-left { padding-left: env(safe-area-inset-left); }
.safe-right { padding-right: env(safe-area-inset-right); }
```

### Mobile Scrolling

```css
.smooth-scroll {
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
}
```

---

## Accessibility

### Color Contrast

All color combinations meet **WCAG AA** standards (4.5:1 for normal text, 3:1 for large text).

### Focus States

Interactive elements have visible focus indicators:

```css
:focus-visible {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
}
```

### Reduced Motion

Respects user's motion preferences:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Usage Examples

### Using Theme Colors

Always use CSS variables, never hardcoded colors:

```tsx
// ✅ Correct
<div className="bg-primary text-primary-foreground">

// ❌ Wrong
<div className="bg-blue-500 text-white">
```

### Custom Components

When creating custom components:

```tsx
import { cn } from "@/lib/utils";

export function CustomComponent({ className, ...props }) {
  return (
    <div
      className={cn(
        "rounded-md border bg-card text-card-foreground shadow-sm",
        className
      )}
      {...props}
    />
  );
}
```

---

## Quick Reference

### Most Common Classes

```tsx
// Backgrounds
bg-background, bg-card, bg-muted, bg-primary

// Text
text-foreground, text-muted-foreground, text-primary

// Borders
border-border, border-input

// Interactive
hover:bg-accent, focus-visible:ring-ring

// Mobile
min-h-[44px], touch-target-large, safe-bottom
```

---

## Resources

- [Shadcn/ui Documentation](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Next Steps**: 
1. Audit all components for theme compliance
2. Replace any remaining hardcoded colors
3. Test all components in both light and dark modes
4. Verify accessibility standards
