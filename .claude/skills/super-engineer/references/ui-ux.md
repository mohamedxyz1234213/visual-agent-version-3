# Modern UI/UX System

Concrete, opinionated defaults for interfaces that look designed and feel alive.
These are starting values — adapt to the product, but never ship raw browser
defaults. Load when a task touches anything a human sees.

## First principle: hierarchy, not decoration

Every screen has ONE primary action/element. Make it obviously dominant (size,
weight, color, position). Everything else recedes. If everything is bold,
nothing is. Decoration that doesn't clarify hierarchy is noise — cut it.

## Motion

Animation communicates *what changed and where it came from*. It is meaning,
not garnish. Wrong motion (slow, linear, gratuitous) feels worse than none.

**Durations** (the 90% range):
- Micro (hover, toggle, button press): **100–150ms**
- Standard (cards in, dropdowns, modals, tab switches): **200–300ms**
- Large/expressive (page/route transitions, hero reveals): **400–600ms**
- Anything >600ms for a routine UI action feels broken. Looping ambient motion
  (shimmer, float, pulse) is the exception — keep it slow (3–8s) and subtle.

**Easing** — never use `linear` for UI (only for continuous spins/progress):
- Enter (element appears): **ease-out** → `cubic-bezier(0.22, 0.61, 0.36, 1)`.
  Starts fast, settles gently — feels responsive.
- Exit (element leaves): **ease-in** → `cubic-bezier(0.4, 0, 1, 1)`.
- Move/resize on screen: **ease-in-out** → `cubic-bezier(0.4, 0, 0.2, 1)`.
- Playful emphasis: a slight overshoot → `cubic-bezier(0.34, 1.56, 0.64, 1)`.
  Use sparingly; never on dense/professional UI.

**Patterns:**
- Entrances combine **fade + small transform** (8–16px slide, or 0.96→1 scale).
  Pure opacity feels flat; pure movement feels jumpy.
- **Stagger** lists/grids 30–60ms per item so they cascade, not pop as a block.
- Animate **transform and opacity** (GPU-composited), not `width/height/top/left`
  (layout thrash). Add `will-change` only on elements about to animate.
- **Respect `prefers-reduced-motion`** — gate non-essential motion behind it.
- Draw-on / handwriting effects: animate `stroke-dashoffset` from length→0, or a
  `clip-path: inset()` wipe. Keep entrance fills `forwards` so nothing snaps back.

## Type

- **One scale, ~1.25 (major third) or 1.333 ratio.** Example (px): 12, 14, 16,
  20, 25, 31, 39, 49. Pick from the scale; don't free-type sizes.
- **Body 16px minimum** on web. Line-height **1.5–1.65** for body, **1.1–1.25**
  for headings. Measure (line length) **45–75 characters**.
- **Weight for hierarchy**, not just size: 400 body, 500–600 emphasis/labels,
  700–800 headings. Avoid <400 for small text.
- **Pairing that works:** one expressive display/serif for headings + one clean
  neutral sans for body — or a single well-built variable sans (Inter, Geist,
  Manrope, IBM Plex) across both with weight contrast. Don't exceed 2 families.
- **Tighten large headings** (letter-spacing −0.01 to −0.03em); leave body alone;
  slightly loosen all-caps labels (+0.04 to +0.08em).
- Tabular numbers (`font-variant-numeric: tabular-nums`) for tables/dashboards.

## Spacing & layout

- **One spacing unit, multiples only.** 4px base → 4, 8, 12, 16, 24, 32, 48, 64.
  Never `13px`, `7px`. Consistent rhythm reads as "designed".
- **Group with proximity**: related items close, unrelated items far. White space
  is the cheapest, strongest hierarchy tool — use more than feels necessary.
- **Align to a grid.** Things that relate share an edge. Optical alignment beats
  mathematical when they disagree (e.g. icons next to text).
- **Constrain content width** (~60–75ch for reading; max ~1200–1280px shells).
  Full-bleed text is hard to read.
- **Radius is a system**, not random: e.g. 8 (inputs/buttons), 12–16 (cards),
  24+ (large surfaces), full (pills/avatars). Nested radius: inner < outer.

## Color & theming

- **Drive everything from tokens / CSS variables** (`--bg`, `--surface`, `--fg`,
  `--muted`, `--border`, `--accent`, `--accent-fg`). Never hardcode hex in
  components. This is what makes dark mode and rebrands a one-file change.
- **One accent**, used intentionally for the primary action and key highlights.
  Neutrals (a 9–11 step grey ramp) do most of the work. Add semantic colors
  (success/warn/danger) only as needed.
- **Contrast is non-negotiable:** body text ≥ 4.5:1, large text/UI ≥ 3:1 against
  its background. Check it; don't eyeball grey-on-grey.
- **Depth via layered surfaces + soft shadows**, not heavy borders. Shadows
  should be soft, low-opacity, and directional (light from above):
  `0 1px 2px rgba(0,0,0,.04), 0 8px 24px -12px rgba(0,0,0,.18)`. Dark mode: lean
  on lighter surface elevation rather than shadow.
- Prefer subtle gradients/tints over flat fills for large surfaces; keep them
  low-contrast so text stays legible.

## Component polish (the details that signal quality)

- **Every interactive element has all states:** default, hover, active/pressed,
  focus-visible, disabled, loading. Missing states are the #1 "cheap" tell.
- **Focus-visible ring** that's clearly visible (2px accent ring + offset). Never
  remove outlines without replacing them — keyboard users need them.
- Buttons: press feedback (scale 0.97 or shadow drop), not just color change.
- **Loading = skeletons or inline spinners**, never a blank jump. Optimistic UI
  where safe. Show progress for >1s operations.
- **Empty states teach**: a short line + the primary action, not a void.
- Inputs: visible label (not placeholder-as-label), inline validation, clear
  error text tied to the field.
- Hit targets ≥ 44×44px on touch. Don't crowd clickable things.
- Images/media: reserve space (aspect-ratio) to prevent layout shift.

## Accessibility (baseline, always)

- Semantic HTML first (`button`, `nav`, `main`, `label`); ARIA only to fill gaps.
- Full keyboard operability; logical tab order; visible focus.
- Contrast ratios above. Don't encode meaning in color alone (add icon/text).
- Respect `prefers-reduced-motion` and `prefers-color-scheme`.
- Alt text for meaningful images; `aria-label` for icon-only buttons.

## Pre-ship polish checklist

- [ ] Clear single primary action per view; hierarchy obvious at a glance.
- [ ] Spacing all on the scale; consistent radii; aligned to a grid.
- [ ] Type from one scale; body ≥16px; comfortable line-height & measure.
- [ ] Color from tokens; contrast passes; one intentional accent.
- [ ] Motion: ease-out entrances, 150–300ms, fade+transform, staggered lists.
- [ ] All interactive states present incl. focus-visible & disabled.
- [ ] Loading/empty/error states designed, not blank.
- [ ] Keyboard navigable; reduced-motion respected; no layout shift.
- [ ] Looks right at mobile, tablet, desktop widths.
