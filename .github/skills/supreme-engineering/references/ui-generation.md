# UI Generation Protocol
## Production-quality UI for any frontend framework

Applies to: React, Vue, Svelte, Angular, SolidJS, Vanilla HTML/CSS/JS, React Native, Flutter, SwiftUI, Jetpack Compose, and any other UI framework.

---

## Pre-Generation Analysis

Before writing a single line of UI:

1. **Component role**: Is this layout / interactive control / display / form / compound (combination)?
2. **State inventory**: List every possible state the component can be in
3. **Data inventory**: What data does it receive? What does it emit/return?
4. **Existing design system**: What tokens, classes, or primitives already exist? Use them.
5. **Framework idioms**: What is the idiomatic way to do this in the target framework?

---

## State Inventory (never skip this)

| State | Must Handle |
|-------|------------|
| Loading | Skeleton or spinner while data fetches |
| Empty | "No items" state — never a blank screen |
| Error | User-friendly error message + recovery action |
| Populated (normal) | The happy path |
| Partial / stale | Data present but potentially outdated |
| Disabled | Prevent interaction when conditions aren't met |
| Read-only | Display without allowing edits |

For interactive controls additionally:
- Hover, focus, active, pressed states
- Validation error state
- Success/confirmation state

---

## Implementation Order (Always Follow This)

### 1. Semantic Structure
Write the structural skeleton first — correct HTML semantics or framework equivalents:
- Headings hierarchy (`h1` → `h2` → `h3`)
- Lists for list-like data (`ul/ol`, not `div div div`)
- `button` for actions, `a` for navigation — never `div onClick`
- `form`, `label`, `input` with correct associations
- Landmark roles (`main`, `nav`, `aside`, `section`, `article`)

### 2. Layout Layer
Apply spatial arrangement before any visual styling:
- Use grid for two-dimensional layouts
- Use flexbox for one-dimensional (row or column)
- Establish the sizing model: intrinsic vs. extrinsic
- Define the spacing rhythm (use the design system scale)

### 3. Visual Layer
Apply visual design using design tokens wherever possible:
- Typography: font-size, font-weight, line-height, letter-spacing
- Color: text, background, border — use semantic tokens not raw values
- Spacing: margin, padding — use scale not arbitrary values
- Borders, border-radius, shadows

### 4. Interaction Layer
- Hover states on all interactive elements
- Focus styles — visible ring, not just color change (for accessibility)
- Active/pressed states
- Transitions: use `transition-colors` and `transition-opacity` sparingly (150–200ms)
- Loading animations if async actions are triggered

### 5. Accessibility Layer
- Every interactive element has an accessible name (label, aria-label, or aria-labelledby)
- All images have `alt` text (empty string for decorative images)
- Color is never the sole means of conveying information
- Keyboard navigation works: Tab, Shift+Tab, Enter, Space, Escape where expected
- Focus is managed correctly in modals and dialogs
- Screen reader only text: `sr-only` class or `visually-hidden` pattern

### 6. Responsive Layer (Mobile-First)
Start at the smallest breakpoint and progressively enhance:
- 320px: minimum supported (most constrained layout)
- 768px: tablet — usually 2-column layouts emerge
- 1024px: small desktop
- 1440px: full desktop

Test mental model at each breakpoint before finalizing.

---

## Framework-Specific Idioms

### React / Next.js
- Components are pure functions of props and state
- `useEffect` for side effects — always clean up subscriptions/timers
- `useMemo` / `useCallback` only when profiling shows a need — not preemptively
- Server components for data-fetching in Next.js App Router
- `"use client"` only for components that need browser APIs or interactivity

### Vue 3
- Composition API (`<script setup>`) preferred
- `reactive()` for objects, `ref()` for primitives
- `computed()` for derived state — never compute in template
- `v-bind` shorthand (`:`) for dynamic props

### Svelte
- Reactivity is compiler-level — `$:` for reactive statements
- Stores for cross-component state
- `{#each}` with a `key` for list rendering

### Tailwind CSS
- Mobile-first (`sm:`, `md:`, `lg:`, `xl:`)
- Extract repeated class combinations to components, not to `@apply`
- Use `group` and `peer` for neighbor-dependent styling

### CSS Modules / Scoped CSS
- One file per component
- Use semantic class names, not utility names

---

## UI Quality Checklist

### Visual
- [ ] Consistent spacing using the design scale (no arbitrary pixel values)
- [ ] Typography hierarchy is clear
- [ ] Color contrast: 4.5:1 for body text, 3:1 for large text (WCAG AA)
- [ ] Visual weight guides the eye to the primary action

### Interaction
- [ ] All interactive elements have hover states
- [ ] Focus styles visible and not just color-based
- [ ] No layout shift when content loads or state changes
- [ ] Animations: purposeful, brief (≤300ms), respects `prefers-reduced-motion`

### Accessibility
- [ ] Full keyboard navigation
- [ ] All interactive elements labeled
- [ ] Form fields have associated labels
- [ ] Error messages are associated with their field (`aria-describedby`)
- [ ] Modal/dialog traps focus and restores on close

### Responsive
- [ ] No horizontal scroll at any standard breakpoint
- [ ] Touch targets ≥ 44×44px on mobile
- [ ] Text readable without horizontal scrolling on 320px
- [ ] Images and media scale correctly

### Code Quality
- [ ] No inline styles (use classes or design tokens)
- [ ] No hardcoded colors or sizes that should be tokens
- [ ] Conditional classes use established patterns (clsx, cn, classList)
- [ ] Event handlers named descriptively (`handleSubmit`, not `onClick`)
