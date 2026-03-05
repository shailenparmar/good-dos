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
  onPlaySound: (isSubtask: boolean, priority?: number) => void
  onMoveTask?: (taskId: string, newDate: string) => void
  categoryColorMap?: Record<string, string>
  selectedTaskId?: string | null
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
  categoryColorMap,
  selectedTaskId,
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

  let highlightShadow = 'none'
  if (isLockedDate) {
    highlightShadow = 'inset 0 0 0 12px hsla(var(--h), var(--s), var(--l), 0.7)'
  } else if (isHighlighted && isActiveHighlight) {
    highlightShadow = 'inset 0 0 0 12px hsla(var(--h), var(--s), var(--l), 0.7)'
  } else if (isHighlighted) {
    highlightShadow = 'inset 0 0 0 6px hsla(var(--h), var(--s), var(--l), 0.6)'
  }

  let bgColor = 'transparent'
  if (isLockedDate) {
    bgColor = 'hsla(var(--h), var(--s), var(--l), 0.2)'
  } else if (isHighlighted && isActiveHighlight) {
    bgColor = 'hsla(var(--h), var(--s), var(--l), 0.2)'
  } else if (isHighlighted) {
    bgColor = 'hsla(var(--h), var(--s), var(--l), 0.1)'
  }

  return (
    <div
      className="relative flex flex-col min-w-0 h-full overflow-hidden"
      style={{
        boxShadow: isDragOver ? 'inset 0 0 0 6px hsl(var(--h), var(--s), var(--l))' : highlightShadow,
        backgroundColor: isDragOver ? 'hsla(var(--h), var(--s), var(--l), 0.25)' : bgColor,
        borderTop: '3px solid hsla(var(--h), var(--s), var(--l), 0.1)',
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Watermark — large translucent day number / TODAY */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
        {isToday ? (
          <div
            className="flex justify-between font-mono font-black leading-none"
            style={{
              color: 'hsl(var(--h), var(--s), var(--l))',
              opacity: 0.2,
              width: '86%',
              fontSize: 'clamp(24px, 4vw, 64px)',
            }}
          >
            {'TODAY'.split('').map((ch, i) => <span key={i}>{ch}</span>)}
          </div>
        ) : (
          <span
            className="font-mono leading-none"
            style={{
              color: 'hsl(var(--h), var(--s), var(--l))',
              opacity: 0.2,
              fontSize: 'clamp(48px, 8vw, 120px)',
              fontWeight: 900,
            }}
          >
            {dayNum}
          </span>
        )}
      </div>

      {/* Header */}
      <div
        className="relative z-10 flex items-baseline flex-shrink-0"
        style={{ gap: 'var(--sp-sm)', padding: 'var(--sp-sm) var(--sp-sm)' }}
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
      <div className="relative z-10 overflow-y-auto scrollbar-hide flex flex-col" style={{ padding: 'var(--sp-xs)' }}>
        {tasks.map((task, idx) => (
          <div key={task.id} style={{ marginTop: idx > 0 ? '-3px' : undefined }}>
            <CalendarTaskItem
              task={task}
              onToggle={onToggle}
              onCyclePriority={onCyclePriority}
              onClick={onTaskClick}
              onPlaySound={onPlaySound}
              categoryColor={task.categoryId ? categoryColorMap?.[task.categoryId] : undefined}
              isSelected={selectedTaskId === task.id}
              draggable
              onDragStart={e => {
                e.dataTransfer.setData('text/task-id', task.id)
                e.dataTransfer.effectAllowed = 'move'
              }}
            />
          </div>
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
