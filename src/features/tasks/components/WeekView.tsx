import { useEffect, useRef } from 'react'
import type { Task } from '../types'
import { DayColumn } from './DayColumn'
import { toDateString, isSameDay } from '@shared/utils/date'

const DAY_NAMES = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

interface WeekViewProps {
  days: Date[]
  getTasksForDate: (dateStr: string) => Task[]
  onToggle: (id: string) => void
  onCyclePriority: (id: string) => void
  onTaskClick: (task: Task) => void
  onDayEmptyClick: (dateStr: string) => void
  onPlaySound: (isSubtask: boolean) => void
}

export function WeekView({
  days,
  getTasksForDate,
  onToggle,
  onCyclePriority,
  onTaskClick,
  onDayEmptyClick,
  onPlaySound,
}: WeekViewProps) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to today on mobile
  useEffect(() => {
    const container = scrollRef.current
    if (!container) return
    const todayIndex = days.findIndex(d => isSameDay(d, today))
    if (todayIndex < 0) return
    const col = container.children[todayIndex] as HTMLElement
    if (col) {
      col.scrollIntoView({ behavior: 'instant', inline: 'start', block: 'nearest' })
    }
  }, [days]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={scrollRef}
      className="flex-1 min-h-0
        grid grid-cols-7
        max-md:flex max-md:overflow-x-auto max-md:snap-x max-md:snap-mandatory"
      style={{ scrollbarWidth: 'none' }}
    >
      {days.map((date, i) => {
        const dateStr = toDateString(date)
        const isToday = isSameDay(date, today)
        return (
          <div
            key={dateStr}
            className="min-h-0 h-full
              max-md:min-w-[min(280px,85vw)] max-md:snap-start max-md:flex-shrink-0"
            style={{
              borderRight: i < 6
                ? '3px solid hsla(var(--h), var(--s), var(--l), 0.07)'
                : undefined,
            }}
          >
            <DayColumn
              date={date}
              dayName={DAY_NAMES[date.getDay()]}
              tasks={getTasksForDate(dateStr)}
              isToday={isToday}
              onToggle={onToggle}
              onCyclePriority={onCyclePriority}
              onTaskClick={onTaskClick}
              onEmptyClick={onDayEmptyClick}
              onPlaySound={onPlaySound}
            />
          </div>
        )
      })}
    </div>
  )
}
