import { useState, useCallback } from 'react'
import type { Task } from '../types'

interface MonthDayCellProps {
  date: Date
  dateStr: string
  tasks: Task[]
  isToday: boolean
  isCurrentMonth: boolean
  filterMatch?: 'none' | 'match' | 'dimmed'
  isActiveHighlight?: boolean
  isLockedDate?: boolean
  hasLockedDate?: boolean
  onClick: (dateStr: string) => void
  onToggle: (id: string) => void
  onCyclePriority: (id: string) => void
  onTaskClick: (task: Task) => void
  onPlaySound: (isSubtask: boolean, priority?: number) => void
  onMoveTask?: (taskId: string, newDate: string) => void
}

function getPriorityColor(priority: number): string {
  switch (priority) {
    case 2: return 'hsl(0, 80%, 55%)'
    case 1: return 'hsl(45, 90%, 55%)'
    default: return 'transparent'
  }
}

export function MonthDayCell({ date, dateStr, tasks, isToday, isCurrentMonth, filterMatch = 'none', isActiveHighlight, isLockedDate, onClick, onToggle, onTaskClick, onPlaySound, onMoveTask }: MonthDayCellProps) {
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

  const handleDragStart = useCallback((e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/task-id', taskId)
    e.dataTransfer.effectAllowed = 'move'
  }, [])

  const allTasks = tasks

  // ── Background ──
  let bgColor = 'transparent'
  if (isLockedDate) {
    bgColor = 'hsla(var(--h), var(--s), var(--l), 0.2)'
  } else if (filterMatch === 'match') {
    bgColor = isActiveHighlight
      ? 'hsla(var(--h), var(--s), var(--l), 0.2)'
      : 'hsla(var(--h), var(--s), var(--l), 0.1)'
  }

  // ── Opacity ──
  const cellOpacity = isCurrentMonth ? 1 : 0.12

  // ── Highlight — inset box-shadow so grid borders stay consistent ──
  let highlightShadow = 'none'
  if (isLockedDate) {
    highlightShadow = 'inset 0 0 0 12px hsl(var(--h), var(--s), var(--l))'
  } else if (filterMatch === 'match' && isActiveHighlight) {
    highlightShadow = 'inset 0 0 0 12px hsl(var(--h), var(--s), var(--l))'
  } else if (filterMatch === 'match') {
    highlightShadow = 'inset 0 0 0 6px hsla(var(--h), var(--s), var(--l), 0.6)'
  } else if (isToday) {
    highlightShadow = 'inset 0 0 0 3px hsla(var(--h), var(--s), var(--l), 0.2)'
  }

  const handleSmack = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation()
    onPlaySound(false, task.priority)
    onToggle(task.id)
  }

  return (
    <div
      className="relative overflow-hidden"
      style={{
        opacity: cellOpacity,
        backgroundColor: isDragOver ? 'hsla(var(--h), var(--s), var(--l), 0.25)' : bgColor,
        borderRight: '3px solid hsla(var(--h), var(--s), var(--l), 0.08)',
        borderBottom: '3px solid hsla(var(--h), var(--s), var(--l), 0.08)',
        boxShadow: isDragOver ? 'inset 0 0 0 6px hsl(var(--h), var(--s), var(--l))' : highlightShadow,
      }}
      onClick={() => onClick(dateStr)}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Day number / TODAY — big watermark, clipped to cell */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
        {isToday ? (
          <div
            className="flex justify-between font-mono font-black leading-none"
            style={{
              color: 'hsl(var(--h), var(--s), var(--l))',
              opacity: 0.35,
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
            {date.getDate()}
          </span>
        )}
      </div>

      {/* Tasks — single column, shrinks to fit */}
      {allTasks.length > 0 && (() => {
        const totalRows = allTasks.length
        // Scale square + text down when many tasks
        const sqSize = totalRows <= 3 ? 'clamp(20px, 3vw, 32px)' : totalRows <= 5 ? 'clamp(16px, 2.2vw, 24px)' : 'clamp(12px, 1.6vw, 18px)'
        const txtSize = totalRows <= 3 ? 'clamp(12px, 1.6vw, 16px)' : totalRows <= 5 ? 'clamp(10px, 1.2vw, 13px)' : 'clamp(8px, 1vw, 11px)'
        const gap = totalRows <= 3 ? '4px' : '2px'

        return (
          <div
            className="relative z-10 h-full grid overflow-hidden p-1"
            style={{
              gridTemplateColumns: '1fr',
              gap,
            }}
          >
            {allTasks.map(task => {
              const isDone = task.completed

              return (
                <div
                  key={task.id}
                  className="flex items-center gap-1 min-w-0"
                  draggable
                  onDragStart={e => handleDragStart(e, task.id)}
                >
                  {isDone ? (
                    <button
                      className="flex-shrink-0 relative active:scale-75"
                      style={{
                        width: sqSize,
                        height: sqSize,
                        backgroundColor: 'transparent',
                        border: '3px solid black',
                      }}
                      onClick={e => { e.stopPropagation(); onToggle(task.id) }}
                    >
                      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <line x1="0" y1="0" x2="100" y2="100" stroke="hsl(var(--h), var(--s), var(--l))" strokeWidth="12" />
                        <line x1="100" y1="0" x2="0" y2="100" stroke="hsl(var(--h), var(--s), var(--l))" strokeWidth="12" />
                      </svg>
                    </button>
                  ) : (
                    <button
                      className="flex-shrink-0 active:scale-75"
                      style={{
                        width: sqSize,
                        height: sqSize,
                        backgroundColor: getPriorityColor(task.priority),
                        border: '3px solid black',
                      }}
                      onClick={e => handleSmack(task, e)}
                    />
                  )}
                  <button
                    className="flex-1 min-w-0 text-left truncate font-mono font-black hover:underline"
                    style={{
                      color: 'hsl(var(--h), var(--s), var(--l))',
                      fontSize: txtSize,
                      lineHeight: '1.2',
                      textDecoration: isDone ? 'line-through' : 'none',
                    }}
                    onClick={e => {
                      e.stopPropagation()
                      onTaskClick(task)
                    }}
                  >
                    {task.text || 'untitled'}
                  </button>
                </div>
              )
            })}
          </div>
        )
      })()}

    </div>
  )
}
