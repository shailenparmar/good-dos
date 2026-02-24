# Claude Code Instructions — Good Weeks

## Project Overview

"Good Weeks" — local-first PWA calendar-based task manager. No server, no accounts — everything stored in IndexedDB (via Dexie) and localStorage.

**Dev server:** `npm run dev` → http://localhost:5173/

## Tech Stack

- Vite 7 + React 19 + TypeScript 5.9
- Tailwind CSS 4
- Dexie 4.3 (IndexedDB wrapper) + dexie-react-hooks
- PWA via vite-plugin-pwa (Workbox, 60s auto-update polling)
- Web Audio API for completion sounds

## Project Structure

```
src/
├── features/
│   ├── tasks/
│   │   ├── components/    # Calendar views, task items, inputs, modals
│   │   ├── hooks/         # useTasks, useRecurring, useAutoCleanup, useTaskSound
│   │   └── types.ts       # Task, TypeTag, RecurrenceRule
│   ├── theme/
│   │   ├── components/    # ColorPicker, ThemePicker
│   │   ├── context/       # ThemeContext & ThemeProvider
│   │   └── types.ts       # ColorPreset, ThemeState
│   └── settings/
│       └── components/    # SettingsPanel
├── shared/
│   ├── components/        # ErrorBoundary, FunctionButton
│   ├── storage/           # db.ts (Dexie), index.ts (localStorage helpers)
│   ├── utils/             # date.ts, messages.ts, sound.ts
│   └── version.ts         # APP_VERSION
├── App.tsx
├── main.tsx
└── index.css
```

## User Terminology → Code Mapping

When the user says **this**, they mean **that** in code:

### Views
| Term | Meaning | Component |
|------|---------|-----------|
| **month view** | The 7-column calendar grid showing the full month | `MonthView.tsx` |
| **week view** | The 7-column day-by-day vertical list view | `WeekView.tsx` |
| **daycell** | A single date square in the month view | `MonthDayCell.tsx` |
| **day column** | A single day's vertical strip in week view | `DayColumn.tsx` |

### Task UI
| Term | Meaning | Component / Code |
|------|---------|-----------------|
| **checkbox** / **square** | The small colored square next to a task (click to complete) | The `<button>` with `getPriorityColor()` in `MonthDayCell` / `CalendarTaskItem` |
| **X** | The crossed-out square shown when a task is done | The `<svg>` with two diagonal lines inside the checkbox |
| **task text** / **task name** | The truncated label next to the checkbox | The `<button>` with `task.text` |
| **taskedit** | The panel that opens when you click a task's text | `TaskEditPanel.tsx` |
| **smack** | Clicking an incomplete task's checkbox to mark it done (plays sound) | `handleSmack()` in `MonthDayCell` |
| **typetag** | Auto-colored tag assigned to a task (replaces old "category"). Fixed color palette in `TAG_COLORS` (`types.ts`), indexed by position | `TypeTag` in `types.ts`, `tagColor()` for colors, rendered in `TaskEditPanel.tsx` |

### Input Bar
| Term | Meaning | Component / Code |
|------|---------|-----------------|
| **typer** | The main text input at the top of the screen | `TaskInputBar.tsx`, the `<input>` element |
| **daybc** | The locked date breadcrumb chip (e.g. "FRI 27") shown after selecting a day | The `lockedDate` / `lockedDateLabel` div in `TaskInputBar` |
| **taskbc** | The locked task name breadcrumb chip shown after typing a name | The `lockedName` div in `TaskInputBar` |
| **date step** | First step of task creation — pick a day | `step === 'date'` |
| **name step** | Second step — type the task name | `step === 'name'` |
| **priority step** | Third step — pick none/yellow/red | `step === 'priority'` |

### Color Picker
| Term | Meaning | Component / Code |
|------|---------|-----------------|
| **SL rectangle** / **left rectangle** | The saturation/lightness 2D gradient pad | `ColorPicker` with `part="sl"` |
| **hue rectangle** / **spectrum** | The rainbow gradient bar for picking hue | `ColorPicker` with `part="hue"` |
| **needle** | The vertical line indicator inside a hue rectangle | The `<div>` with `needleWidth` in hue picker (currently 4px idle, 12px dragging) |
| **dot** | The square indicator inside an SL rectangle | The `<div>` with `dotSize` in SL picker (currently 12px idle, 24px dragging) |
| **text color** | The foreground/text HSL color (`--h`, `--s`, `--l`) | `type="text"` pickers |
| **background color** | The background HSL color (`--bh`, `--bs`, `--bl`) | `type="background"` pickers |

### Navigation
| Term | Meaning | Component / Code |
|------|---------|-----------------|
| **arrows** / **nav arrows** | The `‹` and `›` buttons for prev/next month/week | The `onPrev` / `onNext` buttons in `TaskInputBar` |
| **today button** | The date display between arrows that jumps to current period | The `onToday` button showing month+day |
| **week/month toggle** | The two buttons to switch between views | The `onViewChange` buttons |
| **colors button** | Opens/closes the inline color picker strip | The `onSettings` button |

### Calendar
| Term | Meaning | Code |
|------|---------|------|
| **watermark** | The large faded day number (or "TODAY") behind tasks in each cell | The `absolute inset-0` div in `MonthDayCell` with opacity 0.2 |
| **highlight** | The inset box-shadow on a cell when it matches input filtering | `highlightShadow` in `MonthDayCell` |
| **locked date** | The date that's been selected in the input bar, shown with thick highlight | `isLockedDate` / `lockedDate` state |

## View Parity Contract (MonthView ↔ WeekView)

Any change to one view MUST be mirrored in the other. The shared rules:

### Task Rendering
Both views render tasks as **`[square checkbox][task text box]`**:
- **Checkbox**: `aspect-ratio: 1`, `flex-shrink-0`, fill = `getPriorityColor(priority)`, border = typetag color or `0.2` default. X SVG inside (strokeWidth 12) when completed.
- **Task text box**: `flex-1 min-w-0`, border = same as checkbox, `borderLeft: none`. Font mono, weight 400 (700 on hover/selected).
- **Month** renders inline in `MonthDayCell.tsx`. **Week** uses `CalendarTaskItem.tsx` in `DayColumn.tsx`.

### Click Behavior
- **Day selection**: `onMouseDown` (NOT onClick) to avoid layout-shift issues when edit panel opens.
- **Task interactions**: `e.stopPropagation()` on both checkbox and text box to prevent bubbling to day click.
- **Checkbox click**: plays sound + toggles complete.
- **Text click**: toggles edit panel (click same task = close).

### Highlight Shadows (inset box-shadow, consistent across views)
| State | Shadow |
|-------|--------|
| Locked date | `inset 0 0 0 12px` alpha `0.7` |
| Active highlight | `inset 0 0 0 12px` alpha `0.7` |
| Filter match | `inset 0 0 0 6px` alpha `0.6` |
| Cursor (month only) | `inset 0 0 0 6px` alpha `0.4` |
| Today | `inset 0 0 0 3px` alpha `0.2` |

### Date Options for Input Bar
Both views provide date options sorted **today-first** (closest future dates first, then past). Never start from the leftmost/earliest day of the period.

### Cell Borders
- **Month**: 3px `borderRight` + `borderBottom` on each cell, outer `border` on the grid container (alpha `0.1` / `0.08`).
- **Week**: 3px `borderRight` between columns, 3px `borderTop` on each `DayColumn` (alpha `0.1` / `0.07`).

### Drag & Drop
Both support dragging tasks between dates via `text/task-id` dataTransfer.

### Props Passed Through
Both views receive and forward: `onToggle`, `onCyclePriority`, `onTaskClick`, `onPlaySound(isSubtask, priority)`, `onMoveTask`, `categoryColorMap`, `selectedTaskId`, highlight/locked state.

## Style Rules (see docs/STYLE_GUIDE.md for full details)

- **Monospace only.** SF Mono > Fira Code > system mono.
- **Sharp corners.** Global `border-radius: 0 !important`.
- **No transitions.** Everything instant.
- **Two opacity tiers.** 1 (full) or 0.2 (watermark). No in-between.
- **Two border alphas.** 1 (active/selected) or 0.2 (inactive/default).
- **Three border widths:** THICK (18px) for main input/modals, MEDIUM (9-12px) for calendar cells, NORMAL (3px) for everything else.
- **Selection indicator:** 6px border for selected items within a group (priority, category, recurrence).
- **Font weight:** Always bold (700) or black (900). Never regular.

## Data Models

### Task
```typescript
{
  id: string              // timestamp36 + random
  text: string
  completed: boolean
  completedAt?: number
  priority: 0 | 1 | 2    // None, Medium, High
  categoryId?: string
  dueDate?: string        // "YYYY-MM-DD"
  parentId: string        // "" = top-level, task id = subtask
  recurrence?: RecurrenceRule
  sortOrder: number
  createdAt: number
  updatedAt: number
}
```

### TypeTag
```typescript
{ id: string, name: string }
// Colors from fixed TAG_COLORS palette in types.ts: blue, green, purple, teal, pink, indigo
// Access via tagColor(index) — cycles through palette
```

### RecurrenceRule
```typescript
{
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom'
  interval: number
  daysOfWeek?: number[]   // 0-6
  dayOfMonth?: number     // 1-31
  endDate?: string
}
```

## Database

Dexie v2 schema in `src/shared/storage/db.ts`:
- **tasks:** indexed on `id, parentId, categoryId, dueDate, completed, sortOrder, createdAt`
- **typetags:** indexed on `id, name` (migrated from `categories` in v2)

## Key Hooks

| Hook | Purpose |
|------|---------|
| `useTasks` | CRUD operations, queries (by date, unscheduled, subtasks) |
| `useRecurring` | Watches completed recurring tasks, auto-creates next instance |
| `useAutoCleanup` | 2s interval deleting blank tasks >3s old |
| `useTaskSound` | Completion sound playback (8 cycling tones) |

## Color System

6 HSL CSS variables: `--h`, `--s`, `--l` (text), `--bh`, `--bs`, `--bl` (background).
Pre-React IIFE in `index.html` reads localStorage and sets vars before paint (no flash).

## Version

Stored in `src/shared/version.ts` as `APP_VERSION`. Currently `0.1.0`.
