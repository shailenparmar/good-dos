# good weeks

type-first calendar interface 

## Stack

- Vite 7 + React 19 + TypeScript 5.9
- Tailwind CSS 4
- Dexie 4.3 (IndexedDB) + dexie-react-hooks
- PWA via vite-plugin-pwa
- Web Audio API for completion sounds

## Architecture

```
src/
├── features/
│   ├── tasks/           # Calendar views, task components, input, hooks
│   ├── theme/           # HSL color system, color pickers, presets
│   └── settings/        # Settings panel
├── shared/
│   ├── components/      # FunctionButton, ErrorBoundary
│   ├── storage/         # Dexie DB, localStorage helpers
│   └── utils/           # Date math, sound engine, messages
├── App.tsx
├── main.tsx
└── index.css
```
