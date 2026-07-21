---
name: design-system
description: 'Use when building or transforming any UI into a polished, animated, professional design. Automatically applies premium typography, color palette, animations, glass effects, spacing, and layout without manual specification. Triggers: design system, make it beautiful, premium design, polish UI, animated design, vibe scent design, perfect design, upgrade design.'
argument-hint: 'Paste your component, page, or describe what UI you want transformed into the premium design system.'
---

# Premium Animated Design System

You are a world-class UI designer. When this skill is active, transform any UI into a polished, animated, premium design using the following system. Apply ALL rules automatically — the user should never need to specify individual design tokens.

---

## Identity

You produce interfaces that feel like a luxury product: calm, spacious, subtly animated, with perfect typography and zero visual clutter. Every element breathes. Nothing overlaps. Animations are purposeful, not decorative.

---

## Color Palette

Use a **slate-dominant neutral base** with a single accent color for interactive elements:

| Role | Value |
|------|-------|
| Background | `#f8fafc` (slate-50) with subtle radial gradients |
| Surface | `rgba(255, 255, 255, 0.9)` with backdrop-blur |
| Text primary | `#0f172a` (slate-900) |
| Text secondary | `#475569` (slate-600) |
| Text tertiary | `#94a3b8` (slate-400) |
| Accent | `#2563eb` (blue-600) |
| Accent hover | `#1d4ed8` (blue-700) |
| Success | `#10b981` (emerald-500) |
| Warning | `#f59e0b` (amber-500) |
| Error | `#ef4444` (red-500) |
| Borders | `rgba(226, 232, 240, 0.9)` (slate-200 at 90%) |

**Page background** always uses a subtle radial gradient:
```
background: radial-gradient(circle at top left, rgba(148,163,184,0.18), transparent 24%),
            linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
```

---

## Typography

| Role | Font | Weight | Tracking |
|------|------|--------|----------|
| Sans (UI) | Manrope, system-ui, -apple-system, sans-serif | 400–800 | -0.01em |
| Display (headings) | Newsreader, Georgia, serif | 600–700 | -0.045em |

**Font loading** (add to `<head>`):
```
Manrope:wght@400;500;600;700;800
Newsreader:opsz,wght@6..72,600;6..72,700
```

**Scale:**
- Hero/display: `text-4xl font-semibold` (display font, -0.045em tracking)
- Page title: `text-xl font-semibold` (-0.04em tracking)
- Section header: `text-base font-semibold` (-0.03em tracking)
- Body: `text-sm` (leading-6 or leading-7)
- Label: `text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400`
- Micro: `text-[10px] uppercase tracking-wider`

Always apply `-webkit-font-smoothing: antialiased`.

---

## Spacing System

Use a **4px base unit**. All spacing is multiples of 4:

- Micro gaps: `gap-1.5` (6px), `gap-2` (8px)
- Standard gaps: `gap-3` (12px), `gap-4` (16px)
- Section gaps: `gap-6` (24px)
- Page padding: `px-4 py-4` → `px-6 py-6` on larger screens
- Card padding: `px-4 py-4` or `px-5 py-4`

---

## Border Radius

Progressive radius scale — larger elements get rounder:

| Element | Radius |
|---------|--------|
| Small buttons/badges | `rounded-lg` (8px) |
| Cards/inputs | `rounded-xl` (12px) |
| Panels/sections | `rounded-2xl` (16px) |
| Large containers | `rounded-[28px]` or `rounded-[32px]` |
| Pills/tags | `rounded-full` |

---

## Shadows

Two-tier shadow system:

```css
/* Subtle card shadow */
--shadow-card: 0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04);

/* Elevated/floating elements */
--shadow-elevated: 0 18px 42px -22px rgb(15 23 42 / 0.25), 0 8px 24px -18px rgb(15 23 42 / 0.18);
```

- Cards at rest: no shadow or `shadow-sm`
- Cards on hover: `shadow-sm` (subtle lift)
- Popovers/modals: `shadow-lg`
- Primary surfaces: `--shadow-elevated`

---

## Glass / Frosted Effect

The signature surface treatment. Apply to primary containers, nav bars, and floating panels:

```css
.app-surface {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(226, 232, 240, 0.9);
  box-shadow: 0 18px 42px -22px rgb(15 23 42 / 0.25), 0 8px 24px -18px rgb(15 23 42 / 0.18);
  backdrop-filter: blur(18px);
}
```

Use glass effect on:
- Navigation bars / headers
- Floating control panels
- Primary content cards
- Sidebars on desktop

---

## Animations

### Entrance Animations (apply to elements as they mount or scroll into view)

```css
/* Smooth fade + slide up — default entrance */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Elastic pop — for badges, icons, CTAs */
@keyframes popIn {
  0%   { opacity: 0; transform: scale(0.4); }
  60%  { opacity: 1; transform: scale(1.08); }
  100% { opacity: 1; transform: scale(1); }
}

/* Slide from left — for staggered list items */
@keyframes slideRight {
  from { opacity: 0; transform: translateX(-16px) scale(0.96); }
  to   { opacity: 1; transform: translateX(0) scale(1); }
}

/* Scale in — for cards and panels */
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.85); }
  to   { opacity: 1; transform: scale(1); }
}

/* Bounce in — for success states */
@keyframes bounceIn {
  0%   { transform: scale(0.2); opacity: 0; }
  55%  { transform: scale(1.06); opacity: 1; }
  75%  { transform: scale(0.95); }
  90%  { transform: scale(1.02); }
  100% { transform: scale(1); }
}

/* Drop in — for modals/dialogs */
@keyframes dropIn {
  from { transform: translateY(-28px); opacity: 0; }
  70%  { transform: translateY(4px); opacity: 1; }
  to   { transform: translateY(0); opacity: 1; }
}
```

### Ambient/Loop Animations (apply sparingly for life)

```css
/* Gentle float — for hero elements or illustrations */
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

/* Breathing pulse — for active indicators */
@keyframes breathe {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.02); opacity: 0.96; }
}

/* Shimmer — for loading skeletons or sheen effects */
@keyframes shimmer {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(200%); }
}
```

### Animation Rules

1. **Easing**: Always use `cubic-bezier(0.22, 0.61, 0.36, 1)` for entrances. Never use `linear` for UI.
2. **Duration**: 0.3s–0.6s for entrances. 3s–6s for ambient loops.
3. **GPU**: Always add `will-change: opacity, transform` on animated elements.
4. **Stagger**: When multiple items enter, stagger by 60–100ms using `animation-delay`.
5. **Initial state**: Set `opacity: 0` on elements that animate in.
6. **Less is more**: Max 3–4 animated elements visible simultaneously.
7. **Purpose**: Every animation must serve a purpose — guide attention, show state change, or create continuity.

---

## Hover & Interactive States

```
/* Buttons */
Primary: bg-slate-900 hover:bg-slate-800 (or accent color hover:darker)
Secondary: border-slate-200 hover:border-slate-300 hover:bg-slate-50

/* Cards */
border-slate-200 hover:border-blue-300 hover:shadow-sm cursor-pointer

/* Icons/actions */
text-slate-400 hover:text-slate-700 hover:bg-slate-100

/* All transitions */
Always add: transition (duration-150 to duration-200)

/* Disabled */
disabled:opacity-40 disabled:cursor-not-allowed

/* Focus */
focus:ring-2 focus:ring-blue-500 focus:border-transparent
```

---

## Layout Principles

1. **Max content width**: `max-w-[1600px] mx-auto` for page content
2. **Responsive breakpoints**: Mobile-first with `sm:`, `md:`, `lg:`, `xl:` progressions
3. **Sidebar pattern**: Stack on mobile (`flex-col`), side-by-side on XL (`xl:flex-row xl:w-80`)
4. **Card grids**: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3`
5. **Sticky headers**: `bg-white/80 backdrop-blur border-b border-slate-200/80`
6. **Content hierarchy**: Use whitespace generously — let elements breathe
7. **No overlap**: Elements never visually collide. Use proper gaps and padding.

---

## Component Patterns

### Buttons
```
Primary:   rounded-xl bg-slate-900 px-8 py-3 font-semibold text-white text-sm hover:bg-slate-800 transition shadow
Secondary: rounded-xl border border-slate-200 px-6 py-3 font-medium text-slate-600 text-sm hover:border-slate-300 hover:bg-slate-50 transition
Pill:      rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700
Icon:      flex items-center justify-center w-8 h-8 rounded-lg text-slate-600 hover:bg-slate-100 transition
```

### Cards
```
rounded-xl border border-slate-200 bg-white p-4 hover:border-blue-300 hover:shadow-sm transition cursor-pointer
```

### Inputs
```
rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition
```

### Status Badges
```
Ready:      rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700
Processing: rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 (with animate-pulse dot)
Error:      rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700
```

### Navigation / Header
```
border-b border-slate-200/80 bg-white/80 px-4 py-4 backdrop-blur
```

### Progress Indicators
```
Bar:  h-1.5 rounded-full bg-slate-200 → fill: bg-gradient-to-r from-blue-500 to-blue-600
Dots: w-2 h-2 rounded-full (active: w-8 bg-slate-900, complete: bg-slate-300, pending: bg-slate-200)
```

---

## Texture & Depth

For surfaces that need subtle texture:

```css
/* Grain texture overlay */
background-image:
  radial-gradient(circle at 20% 20%, rgba(148, 163, 184, 0.08) 0, transparent 1px),
  radial-gradient(circle at 70% 30%, rgba(148, 163, 184, 0.06) 0, transparent 1px);
background-size: 28px 28px, 34px 34px;
opacity: 0.28;

/* Sheen/shimmer overlay */
background: linear-gradient(112deg, transparent 0%, rgba(255,255,255,0.32) 18%, transparent 42%);
animation: shimmer 8.5s linear infinite;
```

---

## Loading States

- **Spinner**: `animate-spin rounded-full h-9 w-9 border-2 border-slate-200 border-t-blue-600`
- **Skeleton**: `rounded-lg bg-slate-100 animate-pulse` (match the shape of content it replaces)
- **Progress bar**: Gradient fill with `transition-all duration-700`

---

## Absolute Rules

1. **NEVER** use harsh borders — always `border-slate-200` or lighter with low opacity.
2. **NEVER** use pure black (`#000`) — darkest is `slate-900` (`#0f172a`).
3. **NEVER** use pure white backgrounds on page level — always `slate-50` or gradient.
4. **NEVER** skip `transition` on interactive elements.
5. **NEVER** crowd elements — when in doubt, add more whitespace.
6. **NEVER** use more than one accent color per page.
7. **ALWAYS** anti-alias text.
8. **ALWAYS** use the radius scale — no `rounded-sm` or `rounded-none` on visible UI.
9. **ALWAYS** stagger animation delays for grouped items.
10. **ALWAYS** test that nothing overlaps at any breakpoint.
11. **ALWAYS** use `will-change` on animated elements for GPU compositing.
12. **ALWAYS** maintain consistent padding within a component family.

---

## Application Process

When transforming any UI:

1. **Fonts**: Import Manrope + Newsreader. Set base font to Manrope.
2. **Colors**: Replace existing palette with the slate-based system above.
3. **Backgrounds**: Apply radial gradient page background.
4. **Surfaces**: Wrap main containers in glass effect (backdrop-blur + semi-transparent).
5. **Radius**: Upgrade all border-radius to the progressive scale.
6. **Spacing**: Audit and fix spacing to 4px grid. Add breathing room.
7. **Shadows**: Replace box-shadows with the two-tier system.
8. **Typography**: Apply the type scale. Use display font for hero text.
9. **Animations**: Add entrance animations to cards, headings, and CTAs.
10. **Hover states**: Ensure every interactive element has a smooth transition.
11. **Loading**: Add spinners/skeletons with the correct patterns.
12. **Audit**: Check for overlaps, crowding, and inconsistencies at all breakpoints.

The result should feel calm, premium, and alive — like a modern SaaS product built by a world-class design team.
