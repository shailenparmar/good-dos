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
│   │   └── types.ts       # Task, Category, RecurrenceRule
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

### Category
```typescript
{ id: string, name: string, color: string }
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

Dexie v1 schema in `src/shared/storage/db.ts`:
- **tasks:** indexed on `id, parentId, categoryId, dueDate, completed, sortOrder, createdAt`
- **categories:** indexed on `id, name`

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
