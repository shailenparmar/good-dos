# Good Weeks — Style Guide

## Design Principles

- **Monospace everything.** SF Mono > Fira Code > system monospace. No sans-serif.
- **Sharp corners.** Zero border-radius globally (`border-radius: 0 !important`).
- **No transitions.** All state changes are instant. No easing, no fades.
- **No hover cursors.** Cursor is always `default` except on text inputs (`text`).
- **Two opacity tiers.** Elements are either full opacity (1) or watermark-dim (0.2). No in-between.

## Color System

All colors derive from 6 HSL CSS variables set on `:root`:

| Variable | Role | Default |
|----------|------|---------|
| `--h` | Text hue | 0 |
| `--s` | Text saturation | 0% |
| `--l` | Text lightness | 95% |
| `--bh` | Background hue | 0 |
| `--bs` | Background saturation | 0% |
| `--bl` | Background lightness | 8% |

### Usage Patterns

```css
/* Full text color */
color: hsl(var(--h), var(--s), var(--l))

/* Text at watermark opacity */
color: hsla(var(--h), var(--s), var(--l), 0.2)

/* Background color */
background-color: hsl(var(--bh), var(--bs), var(--bl))

/* Subtle background tint */
background-color: hsla(var(--h), var(--s), var(--l), 0.07)
```

### Priority Colors

| Level | Value | Color |
|-------|-------|-------|
| None | 0 | Theme text at 0.5 alpha |
| Medium | 1 | `hsl(45, 90%, 55%)` — yellow |
| High | 2 | `hsl(0, 80%, 55%)` — red |

### Border Alphas

Only two border alpha values:

- **Active / selected:** 1 (full)
- **Inactive / default:** 0.2

## Border System

Three tiers, applied consistently by element type:

| Tier | Width | Used For |
|------|-------|----------|
| **THICK** | 18px | Main input box, modal frame |
| **MEDIUM** | 9–12px | Calendar day cells (9px default, 12px for highlighted/locked states) |
| **NORMAL** | 3px | Everything else — checkboxes, buttons, grid lines, edit panel, settings |

### Selection Indicator

Active/selected state uses 6px border (between NORMAL and MEDIUM) to indicate selection within a group:
- Priority squares: 6px themed border when selected, 3px transparent when not
- Category buttons: 6px colored border when selected, 3px when not
- Recurrence buttons: 6px when active, 3px when not

## Typography

| Context | Font Size | Weight |
|---------|-----------|--------|
| Month title | `clamp(22px, 3vw, 36px)` | 900 (black) |
| Main input | `clamp(22px, 3vw, 36px)` | 900 |
| Arrow buttons | `clamp(22px, 3vw, 36px)` | 900 |
| Day watermark numbers | `clamp(48px, 8vw, 120px)` | 900 |
| TODAY watermark | `clamp(28px, 5vw, 72px)` | 900 |
| Edit panel controls | `clamp(11px, 1.3vw, 14px)` | 700–900 |
| Calendar task text | Scales with density (3 tiers) | 900 |
| Color picker labels | `clamp(13px, 1.8vw, 20px)` | 900 |

All text is `font-mono`. Weight is always **bold** (700) or **black** (900). No regular/light weights.

## Component Terminology

### Layout Regions

- **Input Bar** — The persistent top bar with the multi-step task creation wizard (date > name > priority). Contains the main input, breadcrumb trail, nav controls, and colors button.
- **Month Grid** — The 7-column calendar grid showing day cells.
- **Edit Panel** — The inline panel that appears below the input bar when a task is clicked for editing. Shows name input, priority squares, categories, and recurrence controls.
- **Color Picker** — The inline 4-column strip (SL square, text hue, bg hue, SL square) that appears when the colors button is toggled.
- **Settings Panel** — The slide-out right panel with theme presets, categories, and preferences.

### Interactive Elements

- **Day Cell** — A single cell in the month grid. Contains a watermark number (or "TODAY"), task squares, and task text.
- **Task Square** — The small colored square next to each task in a day cell. Color = priority. Click to complete (triggers boom animation + sound).
- **Breadcrumb** — The bordered boxes in the input bar showing the current wizard step values (date, name, priority).
- **Priority Square** — The colored selection squares in the edit panel (gray/yellow/red).
- **Category Tag** — A bordered label showing a task's category, colored to match.

### Animations & Feedback

- **Boom** — When a task square is clicked to complete: square shrinks to zero, encouraging message appears, completion sound plays.
- **Crossout Sweep** — CSS `::after` line that draws left-to-right through completed task text (300ms).
- **Check Draw** — SVG checkmark stroke animation on checkbox completion (200ms).

### Task Input Wizard Steps

1. **Date step** — Type to fuzzy-filter calendar dates. Matching cells highlight in the month grid. Arrow keys cycle the highlight. Enter confirms.
2. **Name step** — Type the task name. Enter confirms.
3. **Priority step** — Type 0/1/2 or use arrow keys. Enter confirms and creates the task.

### Sound System

- **Completion sound** — Cycles through 8 different Web Audio tones (dings, arps, chords). Different sound per completion.
- **Snap** — Bandpass-filtered noise burst for UI feedback.

## Responsive Behavior

- **Desktop:** 7-column month grid fills the viewport below the input bar.
- **Mobile:** Horizontal scroll with snap points. Safe area insets respected.
- All sizing uses `clamp()` for fluid scaling between breakpoints.

## File Naming

- Components: `PascalCase.tsx`
- Hooks: `camelCase.ts` (prefixed with `use`)
- Utils: `camelCase.ts`
- Types: colocated in `types.ts` per feature
