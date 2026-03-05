import { useState } from 'react'
import { ThemeProvider } from '@features/theme/context/ThemeContext'
import { ErrorBoundary } from '@shared/components/ErrorBoundary'
import { CalendarView } from '@features/tasks/components/CalendarView'
import { SettingsPanel } from '@features/settings/components/SettingsPanel'
import { APP_VERSION } from '@shared/version'

function AppContent() {
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <div
      className="h-dvh flex font-mono"
      style={{
        color: 'hsl(var(--h), var(--s), var(--l))',
        backgroundColor: 'hsl(var(--bh), var(--bs), var(--bl))',
      }}
    >
      {/* Calendar — always visible, click to close settings */}
      <div
        className="flex-1 min-w-0 min-h-0 flex flex-col"
        onClick={settingsOpen ? () => setSettingsOpen(false) : undefined}
      >
        <CalendarView
          settingsOpen={settingsOpen}
          onCloseSettings={() => setSettingsOpen(false)}
        />
      </div>

      {/* Settings — slides in from right, shares space */}
      <SettingsPanel isOpen={settingsOpen} />

      {/* Version — fixed bottom right */}
      <div
        className="fixed bottom-0 right-0 font-mono font-black pointer-events-none"
        style={{ color: 'hsla(var(--h), var(--s), var(--l), 0.4)', fontSize: 'clamp(11px, 1.4vw, 16px)', padding: 'var(--sp-sm)' }}
      >
        v{APP_VERSION}
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </ErrorBoundary>
  )
}
