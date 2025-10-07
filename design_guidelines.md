# Design Guidelines: Bilingual Client Ordering Application

## Design Approach: Productivity-First System Design
**Selected System**: Material Design 3 with enterprise adaptations
**Rationale**: Information-dense B2B ordering tool requiring clarity, efficiency, and robust bilingual/RTL support. Material Design provides proven patterns for data display, forms, and navigation with excellent internationalization support.

## Core Design Principles
1. **Efficiency Over Aesthetics**: Minimize clicks, maximize information density
2. **Bilingual Clarity**: Equal visual weight and readability in Arabic (RTL) and English (LTR)
3. **Scannable Hierarchy**: Quick price comparison and product identification
4. **Action-Oriented**: Clear CTAs for ordering workflow progression

## Color Palette

**Light Mode**:
- Primary: 210 100% 45% (Professional blue for actions/buttons)
- Surface: 0 0% 98% (Clean backgrounds)
- Surface Variant: 210 20% 96% (Cards, elevated surfaces)
- On-Surface: 220 15% 20% (Primary text)
- On-Surface Variant: 220 10% 45% (Secondary text)
- Success: 142 76% 36% (Order confirmations)
- Border: 220 13% 91%

**Dark Mode**:
- Primary: 210 100% 65%
- Surface: 220 15% 12%
- Surface Variant: 220 15% 16%
- On-Surface: 0 0% 95%
- On-Surface Variant: 220 10% 70%
- Success: 142 70% 45%
- Border: 220 15% 22%

## Typography

**Fonts**: 
- Arabic: Noto Sans Arabic (comprehensive weights)
- English: Inter (clean, professional)
- Code/Prices: JetBrains Mono (tabular numbers)

**Scale**:
- H1: 2rem/2.5rem (32px) - semi-bold
- H2: 1.5rem/2rem (24px) - semi-bold  
- Body: 0.875rem/1.375rem (14px) - regular
- Small: 0.75rem/1rem (12px) - metadata, labels
- Price Display: 1.125rem (18px) - mono, medium weight

## Layout System

**Spacing Units**: Consistent 4px base system
- Common spacing: `space-2` (8px), `space-4` (16px), `space-6` (24px), `space-8` (32px)
- Card padding: `p-4` to `p-6`
- Section spacing: `gap-6` to `gap-8`
- Page margins: `px-4 md:px-6`

**Container Strategy**:
- Max width: `max-w-7xl` for main content
- Sidebar width: `w-80` (320px) for cart/filters
- Product cards: `min-w-[280px]` responsive grid

**RTL Implementation**:
- Mirror all horizontal spacing/margins programmatically
- Flip icon directions (chevrons, arrows)
- Maintain numerical alignment (prices right-aligned in LTR, left in RTL)

## Component Library

### Navigation
- **Top Bar**: Logo + client selector + language toggle + cart icon with badge + user menu
- **Secondary Bar**: Search + category filters + template selector
- Sticky positioning on scroll, elevated shadow
- Compact height: `h-14` to `h-16`

### Product Display
- **Grid Layout**: 2-4 columns responsive (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`)
- **Product Cards**: Elevated surface, image thumbnail, product name, client-specific price prominently displayed, quantity controls, add-to-cart button
- **Price Treatment**: Larger mono font, color-coded (regular vs special pricing)
- **Stock Indicators**: Badge system (in stock, low stock, out of stock)

### Shopping Cart
- **Sidebar Panel**: Slide-in from right (LTR) or left (RTL)
- **Line Items**: Product image thumbnail, name, quantity stepper, subtotal, remove action
- **Summary Section**: Subtotal, taxes, total with clear typography hierarchy
- **CTAs**: Primary "Submit Order" button, secondary "Save as Template"

### Order Templates
- **Template Cards**: Named templates with item count, last used date, quick preview
- **Action Menu**: Load, edit, delete with confirmation dialogs
- **Creation Flow**: Modal with template name input, description (optional)

### Order History
- **Table View**: Date, order ID, status badge, items summary, total, actions
- **Filters**: Date range picker, status filter, search by order ID
- **Row Actions**: View details (drawer), reorder, download receipt

### Forms & Inputs
- **Material-style inputs**: Floating labels, clear error states, helper text
- **Quantity Controls**: Outlined steppers with +/- buttons
- **Dropdowns**: Client selector with search, category filters
- **Bilingual placeholders**: Dynamic based on active language

### Feedback Elements
- **Loading States**: Skeleton screens for product grids, linear progress for submissions
- **Success Notifications**: Snackbar/toast from bottom with success checkmark
- **Error Handling**: Inline validation, error banners for submission failures
- **Empty States**: Illustrative icons with clear messaging (empty cart, no templates, no orders)

## Animations
**Minimal, purposeful only**:
- Page transitions: 200ms ease crossfade
- Cart slide-in: 250ms ease-out
- Button states: Built-in Material ripple effects
- Loading skeletons: Subtle shimmer animation

## Images
**Product Images**:
- Thumbnail size: 80x80px in cards, 120x120px in cart
- Placeholder: Light gray surface with product icon
- Format: WebP with JPG fallback
- Loading: Progressive with blur-up effect

**No Hero Image**: This is a utility application - header goes straight into functional interface

## Critical UX Patterns
- **Client Context Persistence**: Selected client remains active across sessions
- **Quick Reordering**: One-click reorder from history, template application
- **Price Transparency**: Always show client-specific pricing, indicate discounts/special rates
- **Bilingual Consistency**: Identical functionality and visual weight in both languages
- **Keyboard Navigation**: Full support for power users (tab order, shortcuts)
- **Responsive Breakpoints**: Mobile-first with tablet (768px) and desktop (1024px) optimizations