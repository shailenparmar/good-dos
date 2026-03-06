# Good Dos — Style Guide

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
| `--l` | Text lightness | 0% |
| `--bh` | Background hue | 120 |
| `--bs` | Background saturation | 100% |
| `--bl` | Background lightness | 75% |

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

Used as checkbox fill and as edit panel priority button border (selected state):

| Level | Value | Border color (selected) |
|-------|-------|------------------------|
| None | 0 | theme color `hsl(var(--h), var(--s), var(--l))` |
| Medium | 1 | `hsl(45, 90%, 55%)` — yellow |
| High | 2 | `hsl(0, 80%, 55%)` — red |

Priority buttons in edit panel: **no fill, colored border only**. Selected = 6px border in priority color. Unselected = 3px border at 0.2 alpha.

### TypeTag Colors

Fixed palette in `TAG_COLORS` (`types.ts`), accessed via `tagColor(index)`:
- Orange `hsl(28, 85%, 55%)`, Lime `hsl(85, 65%, 42%)`, Teal `hsl(175, 65%, 43%)`, Blue `hsl(215, 75%, 58%)`, Purple `hsl(270, 65%, 58%)`, Rose `hsl(325, 65%, 55%)`
- Hues spaced ~60° apart for clear visual distinction
- Cycles for index > 5
- Applied as task box `backgroundColor` at 50% opacity via `tagColorAlpha(i, 0.5)` (produces `hsla(...)`) — fills the box visibly
- Tag buttons in edit panel: colored border + 50% fill when selected; unselected = 3px 0.2 alpha border, transparent bg
- Text on all tag buttons is always theme color — never tag-colored
- Use `tagColor(index)` for full color, `tagColorAlpha(index, alpha)` for transparent variant

### Border Alphas

- **Active / selected:** 1 (full) or 0.7
- **Inactive / default:** 0.2
- **Grid lines:** 0.08
- **Placeholder text:** 0.2 (set via `::placeholder` in `index.css`)

## Border System

Three tiers by element type:

| Tier | Width | Used For |
|------|-------|----------|
| **THICK** | 12px | Flash message only |
| **SELECTION** | 6px | Main input box (typer), breadcrumbs, selected priority/typetag/recurrence buttons, view toggle (active), colors button (active), daycell highlights (leader/locked), task edit panel date arrows |
| **NORMAL** | 3px | Everything else — checkboxes, task boxes, grid lines, edit panel, buttons, nav arrows |

### Highlight System (inset box-shadow, no border overlays, no fills)

All daycell highlights use inset box-shadow at 6px. No border overlay divs. No background fills.

| State | Shadow | Alpha |
|-------|--------|-------|
| **Leader** (active filter match during aim) | `inset 0 0 0 6px` | 0.7 |
| **Locked date** (true SELECT) | `inset 0 0 0 6px` | 0.7 |
| **Seek mode** (Tab/arrow browsing, no text) | `inset 0 0 0 6px` | 0.2 |
| **Candidate** (other filter matches) | `inset 0 0 0 6px` | 0.2 |
| **Drag-over** | `inset 0 0 0 6px` | 1.0 |

Seek mode (Tab/arrow without typing) uses 0.2 — it's not a committed selection, just browsing. Only locked date and aim leader get 0.7.

### Border Collapse

- **MonthView** and **WeekView**: tasks stack adjacent with no overlap — no negative marginTop.
- Never use `borderTop: 'none'` — it breaks `aspect-ratio` on the checkbox.

## Spacing System

5-tier system (multiples of 3) defined as CSS custom properties in `index.css`:

| Tier | Fixed | Responsive clamp | Use for |
|------|-------|-------------------|---------|
| **xs** | `--sp-xs: 3px` | `--sp-xs-r` | Dense task rows, hairline gaps |
| **sm** | `--sp-sm: 6px` | `--sp-sm-r` | Button padding, standard gaps |
| **md** | `--sp-md: 12px` | `--sp-md-r` | Input padding, section gaps |
| **lg** | `--sp-lg: 18px` | `--sp-lg-r` | Container padding |
| **xl** | `--sp-xl: 24px` | `--sp-xl-r` | Modal padding, major separators |

Sub-tier values (1px, 2px) are OK for dense task row overrides only.

## Typography

| Context | Font Size | Weight |
|---------|-----------|--------|
| Main input / flash message | `clamp(22px, 3vw, 36px)` | 900 (black) |
| Nav arrows | `clamp(22px, 3vw, 36px)` | 900 |
| Nav title / breadcrumbs / view toggle | `clamp(13px, 1.8vw, 20px)` | 900 |
| Day watermark numbers | `clamp(48px, 8vw, 120px)` | 900 |
| TODAY watermark | `clamp(24px, 4vw, 64px)` | 900 |
| Edit panel controls | `clamp(11px, 1.3vw, 14px)` | 700–900 |
| Day headers (sun–sat) | `clamp(13px, 1.8vw, 20px)` | 700 |
| Calendar task text (<=3 tasks) | `clamp(13px, 1.8vw, 18px)` | 400 |
| Calendar task text (4–5 tasks) | `clamp(11px, 1.4vw, 15px)` | 400 |
| Calendar task text (6+ tasks) | `clamp(9px, 1.1vw, 12px)` | 400 |

All text is `font-mono`. No regular/light weights except task text at rest (400).

## Task Box Model

Each task in a day cell renders as `[checkbox][task box]`:

```
┌──────┬──────────────────────┐
│      │  task text            │
│  []  │  (truncated)          │
│      │                       │
└──────┴──────────────────────┘
```

- **Row**: `flex items-stretch` — checkbox and task box stretch to equal height.
- **Checkbox**: square (`width: sqSize`, `aspect-ratio: 1`), `flex-shrink-0`, `backgroundColor` = priority color, full 4-wall `border: 3px` at 0.2 alpha. X SVG when completed. Click toggles completion + plays sound.
- **Task box**: `flex-1`, full 4-wall border, `marginLeft: -3px` to collapse the shared border with the checkbox. `backgroundColor` = typetag color at 100% opacity. Click opens TaskEditPanel.
- **Task text**: 400 weight at rest, 900 on hover or when edit panel is open.
- **No overflow-hidden on task container** — the cell handles clipping; task container must not clip its children.
- **Checkbox sizes scale with density**: <=3 tasks: `clamp(18px, 2.5vw, 28px)`, 4-5: `clamp(14px, 2vw, 22px)`, 6+: `clamp(10px, 1.4vw, 16px)`.

## Component Terminology

### Layout Regions

- **Input Bar** (`TaskInputBar.tsx`) — Top bar with multi-step task wizard (date > name > priority), nav arrows, today button, view toggle, colors button.
- **Month Grid** (`MonthView.tsx`) — Day-name header row (SUN–SAT) + 7-column calendar grid. Today's row gets `2fr` height. Day watermark numbers at `clamp(36px, 6vw, 90px)`.
- **Week Grid** (`WeekView.tsx`) — Day-name header row (SUN–SAT, matching month view) + 7-column day-by-day vertical list. Day name is NOT inside the column cell. Day watermark numbers at `clamp(36px, 6vw, 90px)`.
- **Edit Panel** (`TaskEditPanel.tsx`) — Inline panel below input bar: `[name input] [< >] [priority] [typetags] [+] [repeat] [freq] [days] [delete]`. The `< >` arrows move the task ±1 day.
- **Color Picker** (`ColorPicker.tsx`) — Inline 4-column strip: `[text SL] [text hue] [bg hue] [bg SL]`.

### Interactive Elements

- **Day Cell** (`MonthDayCell.tsx`) — Single cell in month grid. Watermark number (or "TODAY" at 0.2 opacity), task checkboxes and task boxes.
- **Checkbox** — Priority-colored square. Click toggles completion (plays sound). X SVG when done.
- **Task Box** — Rectangle right of checkbox. Click opens edit panel. Text goes 900 on hover/selected, 400 at rest. `active:scale-90` on the whole task row (checkbox + box together).
- **TaskEditPanel** — Flat `flex-wrap` row: name input (auto-sizes via `size` attr) → priority → tags → +tag → freq options → delete. Wraps to next line when name is long. View mode (week/month) persists to localStorage.
- **Breadcrumb** — 6px bordered boxes in input bar showing locked date ("FRI 27") and locked task name.

### Feedback

- **Flash message** — On task completion, input bar temporarily shows random success message (1.5s) with 12px full-opacity border.
- **Completion sound** — Cycles through 8 Web Audio tones.

### The Drill (Task Creation Flow)

The full task creation sequence through the typer. Three phases (name > date > priority):

1. **Name** — Placeholder: `"task..."`. Type the task name. Backspace when empty blurs/unfocuses the typer. Enter locks the name as a breadcrumb.
2. **Aim** (date step) — Placeholder: `"day"`. Type to fuzzy-filter dates, producing **candidates** (all matches, 6px/0.2 highlight) and one **leader** (active match, 6px/0.7 highlight). Arrow keys move the **selector** (seek mode, 0.2 highlight — not a true select). Tab cycles. Enter locks the day. Backspace when empty returns to name.
3. **Heat** (priority step) — Placeholder: `"none / yellow / red"`. Type or Tab to cycle. Backspace when empty returns to aim. Enter creates the task.

Breadcrumbs appear left-to-right matching the order you entered them. Normal flow: `[task name] [day] [input]`. If you click a day cell first (date-first entry): `[day] [task name] [input]` — then after entering a name, it skips straight to priority.

### Keyboard Navigation

- **Arrow keys** (date step) — Snake within the current view's dates: left/right ±1 day, up/down ±7 days. Wraps around at edges, never switches month/week.
- **Backspace** — In name step with empty input: blurs the typer. In date/priority step with empty input: goes back one step. Outside any input: deletes the selected task, or the hovered task if none selected (hover + Backspace).
- **Enter** — Advances wizard step. In date step: locks the highlighted date.
- **Escape** — Unwinds: priority → date → name → blur → colors picker → settings → edit panel → snap to today.
- **Tab** — In date step: cycles through dates. In priority step: cycles options. Shift+Tab goes backward.
- **Click name breadcrumb** — Returns to name step with text restored and cursor at end.

### Nav Center Button

- **Month view**: Shows full month name + year (e.g. "march 2026"). Prev/next cycle by month.
- **Week view**: Shows month + day of the Monday (e.g. "mar 5"). Prev/next cycle by week.
- **Click**: Snaps back to current period (today).

## Responsive Behavior

- **Desktop:** 7-column month grid fills viewport below input bar.
- All sizing uses `clamp()` for fluid scaling.

## File Naming

- Components: `PascalCase.tsx`
- Hooks: `camelCase.ts` (prefixed with `use`)
- Utils: `camelCase.ts`
- Types: colocated in `types.ts` per feature
