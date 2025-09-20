# One-Link Design System Specification

## Brand Identity
**One-Link** - A modern, trustworthy influencer commerce platform that bridges suppliers, influencers, and customers with clean, professional aesthetics.

---

## Color System (5 Colors Total)

### Primary Palette
- **Primary**: `indigo-600` (#4F46E5) - Main brand color, CTAs, links
- **Secondary**: `indigo-500` (#6366F1) - Hover states, secondary actions
- **Accent**: `amber-500` (#F59E0B) - Success states, highlights, earnings/commission indicators

### Neutrals
- **Dark**: `gray-900` (#111827) - Primary text, headers
- **Light**: `gray-50` (#F9FAFB) - Backgrounds, cards, subtle sections

### State Colors (Semantic)
- **Success**: `green-500` (#10B981) - Confirmations, verified badges
- **Error**: `red-500` (#EF4444) - Errors, destructive actions
- **Warning**: `yellow-500` (#EAB308) - Low stock, pending states
- **Info**: `blue-500` (#3B82F6) - Information, neutral notifications

---

## Typography System

### Font Family
**Inter** - Modern, highly legible, excellent for interfaces and data-heavy screens

### Hierarchy

**Headings**
- **H1**: `text-4xl font-bold` (36px, 700) - Page titles, hero sections
- **H2**: `text-3xl font-semibold` (30px, 600) - Section headers
- **H3**: `text-2xl font-semibold` (24px, 600) - Subsection headers
- **H4**: `text-xl font-medium` (20px, 500) - Card titles, form sections
- **H5**: `text-lg font-medium` (18px, 500) - Component headers
- **H6**: `text-base font-medium` (16px, 500) - Small headers, labels

**Body Text**
- **Large**: `text-lg leading-relaxed` (18px, 1.625) - Important descriptions
- **Base**: `text-base leading-relaxed` (16px, 1.625) - Standard body text
- **Small**: `text-sm leading-relaxed` (14px, 1.625) - Secondary text, captions

**Specialized**
- **Button Text**: `text-sm font-medium` (14px, 500) - All button labels
- **Caption**: `text-xs text-gray-600` (12px) - Timestamps, metadata
- **Code/Data**: `font-mono text-sm` (14px) - SKUs, IDs, technical data

---

## Spacing & Layout

### Spacing Scale (Generous, Roomy)
- **Micro**: `space-1` (4px) - Icon gaps, tight elements
- **Small**: `space-3` (12px) - Form field gaps, card padding
- **Medium**: `space-6` (24px) - Section spacing, component gaps
- **Large**: `space-12` (48px) - Major section breaks
- **XL**: `space-20` (80px) - Page section dividers

### Border Radius
- **Standard**: `rounded-2xl` (16px) - Cards, modals, major components
- **Small**: `rounded-lg` (8px) - Buttons, inputs, chips
- **Micro**: `rounded-md` (6px) - Small badges, tags

### Shadows (Soft, Elevated)
- **Subtle**: `shadow-sm` - Input focus, hover states
- **Card**: `shadow-lg` - Elevated cards, dropdowns
- **Modal**: `shadow-2xl` - Modals, overlays, important elements

---

## Component Specifications

### Cards & Containers
- **Elevated Cards**: White background, `shadow-lg`, `rounded-2xl`, generous padding (`p-6`)
- **Content Cards**: Product cards, shop previews, user profiles
- **Data Cards**: Analytics, earnings, inventory status

### Forms & Inputs
- **Clean Forms**: Minimal borders, focus states with indigo ring
- **Input Fields**: `rounded-lg`, subtle gray borders, clear focus indicators
- **Accessible Labels**: Always visible, proper contrast, clear hierarchy
- **Validation**: Inline error states with red text and icons

### Interactive Elements
- **Primary CTA**: Indigo background, white text, `rounded-lg`, hover lift effect
- **Secondary CTA**: White background, indigo border/text, hover fill
- **Destructive**: Red background for dangerous actions
- **Ghost**: Transparent background, colored text, hover background

### Loading States
- **Skeleton Loaders**: Gray-200 base with subtle shimmer animation
- **Spinner**: Indigo colored, consistent sizing across components
- **Progressive Loading**: Content appears as it loads, no jarring shifts

### Grid Layouts
- **Responsive Grids**: Mobile-first, 1→2→3→4 columns based on screen size
- **Product Grids**: Consistent aspect ratios, hover effects, clear pricing
- **Dashboard Grids**: Flexible card layouts, proper gap spacing

### Animations (Subtle Framer Motion)
- **Page Transitions**: Smooth fade-in, slight scale effect
- **Hover States**: Gentle lift (translateY), scale, or color transitions
- **Loading**: Pulse effects, smooth skeleton animations
- **Micro-interactions**: Button press feedback, form validation

---

## E-commerce Specific Tokens

### Price Styling
- **Current Price**: `text-2xl font-bold text-gray-900` - Prominent, clear
- **Original Price**: `text-lg line-through text-gray-500` - Crossed out
- **Discount Price**: `text-2xl font-bold text-green-600` - Savings emphasis
- **Commission Rate**: `text-sm font-medium text-amber-600` - Earnings highlight

### Status Badges & Chips
- **In Stock**: Green background, white text, `rounded-full`
- **Low Stock**: Yellow background, dark text, "< 10 left" urgency
- **Out of Stock**: Red background, white text, disabled state
- **Verified**: Green checkmark, "Verified Supplier/Influencer"
- **Pending**: Yellow background, "Awaiting Approval"

### CTA Hierarchy
1. **Primary**: "Add to Cart", "Buy Now" - Indigo, prominent
2. **Secondary**: "Add to Shop", "Save for Later" - Outlined indigo
3. **Tertiary**: "View Details", "Share" - Ghost style
4. **Destructive**: "Remove", "Delete" - Red, confirmation required

---

## UI Pattern Specifications

### Navigation
- **Top Navigation**: Clean header, logo left, user menu right, search center
- **Sidebar**: Collapsible, role-based menu items, clear active states
- **Breadcrumbs**: Gray text with indigo active state, arrow separators

### Overlays & Modals
- **Drawers**: Slide from right, backdrop blur, smooth transitions
- **Modals**: Center-screen, shadow-2xl, backdrop click to close
- **Toasts**: Top-right corner, auto-dismiss, color-coded by type
- **Tooltips**: Dark background, white text, arrow pointer

### Specialized Patterns
- **Upload Dialogs**: Drag-drop zones, progress indicators, file previews
- **Wizards**: Step indicators, progress bar, clear next/back actions
- **Data Tables**: Sortable headers, pagination, row hover states
- **Search & Filters**: Faceted search, clear filter chips, instant results

### Responsive Behavior
- **Mobile-First**: Touch-friendly targets (44px minimum)
- **Tablet**: Optimized for both portrait and landscape
- **Desktop**: Efficient use of space, hover states, keyboard navigation

---

## Accessibility Standards

- **WCAG AA Compliance**: 4.5:1 contrast ratio for normal text, 3:1 for large text
- **Keyboard Navigation**: Full keyboard accessibility, visible focus indicators
- **Screen Readers**: Proper ARIA labels, semantic HTML structure
- **Color Independence**: Never rely solely on color to convey information

---

## Implementation Notes

### Tailwind Configuration
- Uses Tailwind CSS v4 with custom design tokens
- Inter font family configured via Next.js font optimization
- Custom color palette integrated with shadcn/ui components
- Responsive breakpoints: mobile-first approach

### Component Library
- Built on shadcn/ui foundation components
- Custom e-commerce specific components
- Consistent spacing and typography scale
- Accessible by default with proper ARIA support

### Performance Considerations
- Optimized font loading with Next.js
- Efficient CSS with Tailwind's purging
- Minimal animation overhead with Framer Motion
- Progressive image loading for product catalogs

This design system provides a cohesive, scalable foundation for One-Link's influencer commerce platform, balancing modern aesthetics with functional clarity and accessibility.
