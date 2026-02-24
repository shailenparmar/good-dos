import type { Task } from '../types'
import { CalendarTaskItem } from './CalendarTaskItem'
import { toDateString } from '@shared/utils/date'

interface DayColumnProps {
  date: Date
  dayName: string
  tasks: Task[]
  isToday: boolean
  onToggle: (id: string) => void
  onCyclePriority: (id: string) => void
  onTaskClick: (task: Task) => void
  onEmptyClick: (dateStr: string) => void
  onPlaySound: (isSubtask: boolean) => void
}

export function DayColumn({
  date,
  dayName,
  tasks,
  isToday,
  onToggle,
  onCyclePriority,
  onTaskClick,
  onEmptyClick,
  onPlaySound,
}: DayColumnProps) {
  const dateStr = toDateString(date)
  const dayNum = date.getDate()
  const hasTasks = tasks.length > 0

  // Fill the whole column with color when it has tasks
  let bgColor = 'transparent'
  if (isToday && hasTasks) {
    bgColor = 'hsla(var(--h), var(--s), 50%, 0.12)'
  } else if (isToday) {
    bgColor = 'hsla(var(--h), var(--s), 50%, 0.06)'
  } else if (hasTasks) {
    bgColor = 'hsla(var(--h), var(--s), 50%, 0.06)'
  }

  return (
    <div
      className="flex flex-col min-w-0 h-full"
      style={{ backgroundColor: bgColor }}
    >
      {/* Header */}
      <div
        className="flex items-baseline gap-1.5 px-2.5 py-2 flex-shrink-0"
      >
        <span
          className="font-mono font-black uppercase"
          style={{ color: 'hsl(var(--h), var(--s), var(--l))', fontSize: 'clamp(11px, 1.3vw, 14px)' }}
        >
          {dayName}
        </span>
        <span
          className="font-mono font-black uppercase"
          style={{ color: 'hsl(var(--h), var(--s), var(--l))', fontSize: 'clamp(13px, 1.8vw, 20px)' }}
        >
          {dayNum}
        </span>
      </div>

      {/* Tasks */}
      <div className="overflow-y-auto scrollbar-hide px-1.5 py-1 flex flex-col gap-0.5">
        {tasks.map(task => (
          <CalendarTaskItem
            key={task.id}
            task={task}
            onToggle={onToggle}
            onCyclePriority={onCyclePriority}
            onClick={onTaskClick}
            onPlaySound={onPlaySound}
          />
        ))}
      </div>

      {/* Empty space — click target */}
      <button
        className="flex-1 min-h-[40px] w-full cursor-pointer"
        style={{ backgroundColor: 'transparent' }}
        onClick={() => onEmptyClick(dateStr)}
        onMouseEnter={e => {
          e.currentTarget.style.backgroundColor = 'hsla(var(--h), var(--s), 50%, 0.05)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.backgroundColor = 'transparent'
        }}
        aria-label={`Add task to ${dayName} ${dayNum}`}
      />
    </div>
  )
}
