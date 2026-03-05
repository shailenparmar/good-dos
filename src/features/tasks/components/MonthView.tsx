import { useMemo } from 'react'
import type { Task } from '../types'
import { MonthDayCell } from './MonthDayCell'
import { getMonthGrid, toDateString, isSameDay } from '@shared/utils/date'

const DAY_HEADERS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

interface MonthViewProps {
  year: number
  month: number
  getTasksForDate: (dateStr: string) => Task[]
  onToggle: (id: string) => void
  onCyclePriority: (id: string) => void
  onTaskClick: (task: Task) => void
  onDayClick: (dateStr: string) => void
  onPlaySound: (isSubtask: boolean) => void
  highlightedDates?: Set<string>
  activeHighlight?: string | null
  lockedDate?: string | null
  onPrev?: () => void
  onNext?: () => void
  onMoveTask?: (taskId: string, newDate: string) => void
  categoryColorMap?: Record<string, string>
  selectedTaskId?: string | null
}

export function MonthView({ year, month, getTasksForDate, onToggle, onCyclePriority, onTaskClick, onDayClick, onPlaySound, highlightedDates, activeHighlight, lockedDate, onPrev, onNext, onMoveTask, categoryColorMap, selectedTaskId }: MonthViewProps) {
  const grid = getMonthGrid(year, month)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Trim trailing empty weeks
  const trimmedGrid = useMemo(() => {
    let lastNonEmpty = grid.length - 1
    while (lastNonEmpty >= 0 && grid[lastNonEmpty].every(d => d === null)) {
      lastNonEmpty--
    }
    return grid.slice(0, lastNonEmpty + 1)
  }, [grid])

  const hasHighlights = highlightedDates && highlightedDates.size > 0

  // Find which row contains today for double-height
  const todayRowIndex = useMemo(() => {
    for (let wi = 0; wi < trimmedGrid.length; wi++) {
      for (const date of trimmedGrid[wi]) {
        if (date && isSameDay(date, today)) return wi
      }
    }
    return -1
  }, [trimmedGrid, today])


  return (
    <div className="flex-1 min-h-0 flex flex-col relative" style={{ padding: '0 var(--sp-xs) var(--sp-xs)' }}>
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-0 flex-shrink-0">
        {DAY_HEADERS.map(d => (
          <div
            key={d}
            className="text-center font-mono font-bold uppercase"
            style={{
              padding: 'var(--sp-sm) 0',
              color: 'hsla(var(--h), var(--s), var(--l), 0.2)',
              fontSize: 'clamp(13px, 1.8vw, 20px)',
            }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Grid — fills all remaining space */}
      <div
        className="grid grid-cols-7 flex-1 min-h-0"
        style={{
          gridTemplateRows: trimmedGrid.map((_, i) => i === todayRowIndex ? '2fr' : '1fr').join(' '),
          border: '3px solid hsla(var(--h), var(--s), var(--l), 0.1)',
          gap: 0,
        }}
      >
        {trimmedGrid.map((week, wi) =>
          week.map((date, di) => {
            if (!date) {
              return (
                <div
                  key={`${wi}-${di}`}
                  style={{
                    backgroundColor: 'hsla(var(--h), var(--s), var(--l), 0.02)',
                    borderRight: '3px solid hsla(var(--h), var(--s), var(--l), 0.08)',
                    borderBottom: '3px solid hsla(var(--h), var(--s), var(--l), 0.08)',
                  }}
                />
              )
            }
            const dateStr = toDateString(date)
            const isToday = isSameDay(date, today)
            const isCurrentMonth = date.getMonth() === month
            const tasks = getTasksForDate(dateStr)

            let filterMatch: 'none' | 'match' | 'dimmed' = 'none'
            if (hasHighlights) {
              filterMatch = highlightedDates!.has(dateStr) ? 'match' : 'dimmed'
            }

            return (
              <MonthDayCell
                key={dateStr}
                date={date}
                dateStr={dateStr}
                tasks={tasks}
                isToday={isToday}
                isCurrentMonth={isCurrentMonth}
                filterMatch={filterMatch}
                isActiveHighlight={activeHighlight === dateStr}
                isLockedDate={lockedDate === dateStr}
                hasLockedDate={lockedDate !== null && lockedDate !== undefined}
                onClick={onDayClick}
                onToggle={onToggle}
                onCyclePriority={onCyclePriority}
                onTaskClick={onTaskClick}
                onPlaySound={onPlaySound}
                onMoveTask={onMoveTask}
                categoryColorMap={categoryColorMap}
                selectedTaskId={selectedTaskId}
              />
            )
          })
        )}
      </div>

    </div>
  )
}
