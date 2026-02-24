import { useState, useCallback } from 'react'
import type { Task } from '../types'
import { CalendarTaskItem } from './CalendarTaskItem'
import { toDateString } from '@shared/utils/date'

interface DayColumnProps {
  date: Date
  dayName: string
  tasks: Task[]
  isToday: boolean
  isHighlighted?: boolean
  isActiveHighlight?: boolean
  isLockedDate?: boolean
  onToggle: (id: string) => void
  onCyclePriority: (id: string) => void
  onTaskClick: (task: Task) => void
  onEmptyClick: (dateStr: string) => void
  onPlaySound: (isSubtask: boolean) => void
  onMoveTask?: (taskId: string, newDate: string) => void
}

export function DayColumn({
  date,
  dayName,
  tasks,
  isToday,
  isHighlighted,
  isActiveHighlight,
  isLockedDate,
  onToggle,
  onCyclePriority,
  onTaskClick,
  onEmptyClick,
  onPlaySound,
  onMoveTask,
}: DayColumnProps) {
  const dateStr = toDateString(date)
  const dayNum = date.getDate()
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const taskId = e.dataTransfer.getData('text/task-id')
    if (taskId && onMoveTask) {
      onMoveTask(taskId, dateStr)
    }
  }, [dateStr, onMoveTask])

  // Highlight via inset box-shadow (same pattern as MonthDayCell)
  let highlightShadow = 'none'
  if (isLockedDate) {
    highlightShadow = 'inset 0 0 0 12px hsl(var(--h), var(--s), var(--l))'
  } else if (isHighlighted && isActiveHighlight) {
    highlightShadow = 'inset 0 0 0 12px hsl(var(--h), var(--s), var(--l))'
  } else if (isHighlighted) {
    highlightShadow = 'inset 0 0 0 6px hsla(var(--h), var(--s), var(--l), 0.6)'
  } else if (isToday) {
    highlightShadow = 'inset 0 0 0 3px hsla(var(--h), var(--s), var(--l), 0.2)'
  }

  return (
    <div
      className="flex flex-col min-w-0 h-full"
      style={{
        boxShadow: isDragOver ? 'inset 0 0 0 6px hsl(var(--h), var(--s), var(--l))' : highlightShadow,
        backgroundColor: isDragOver ? 'hsla(var(--h), var(--s), var(--l), 0.15)' : undefined,
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
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
            draggable
            onDragStart={e => {
              e.dataTransfer.setData('text/task-id', task.id)
              e.dataTransfer.effectAllowed = 'move'
            }}
          />
        ))}
      </div>

      {/* Empty space — click target */}
      <button
        className="flex-1 min-h-[40px] w-full"
        onClick={() => onEmptyClick(dateStr)}
        aria-label={`Add task to ${dayName} ${dayNum}`}
      />
    </div>
  )
}
