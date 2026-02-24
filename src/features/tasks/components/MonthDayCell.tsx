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
  categoryColorMap?: Record<string, string>
  selectedTaskId?: string | null
}

function getPriorityColor(priority: number): string {
  switch (priority) {
    case 2: return 'hsl(0, 80%, 55%)'
    case 1: return 'hsl(45, 90%, 55%)'
    default: return 'transparent'
  }
}

export function MonthDayCell({ date, dateStr, tasks, isToday, isCurrentMonth, filterMatch = 'none', isActiveHighlight, isLockedDate, onClick, onToggle, onTaskClick, onPlaySound, onMoveTask, categoryColorMap, selectedTaskId }: MonthDayCellProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null)

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

      {/* Tasks — box model: [text inside], fill=priority, border=category, X on complete */}
      {allTasks.length > 0 && (() => {
        const totalRows = allTasks.length
        const sqSize = totalRows <= 3 ? 'clamp(18px, 2.5vw, 28px)' : totalRows <= 5 ? 'clamp(14px, 2vw, 22px)' : 'clamp(10px, 1.4vw, 16px)'
        const txtSize = totalRows <= 3 ? 'clamp(13px, 1.8vw, 18px)' : totalRows <= 5 ? 'clamp(11px, 1.4vw, 15px)' : 'clamp(9px, 1.1vw, 12px)'
        const gap = totalRows <= 3 ? '3px' : '1px'
        const pad = totalRows <= 3 ? '3px 6px' : '2px 4px'

        return (
          <div
            className="relative z-10 h-full flex flex-col overflow-hidden p-1"
            style={{ gap }}
          >
            {allTasks.map(task => {
              const catColor = task.categoryId ? categoryColorMap?.[task.categoryId] : undefined
              const borderColor = catColor ?? 'hsla(var(--h), var(--s), var(--l), 0.2)'

              const isBold = hoveredTaskId === task.id || selectedTaskId === task.id

              return (
                <div
                  key={task.id}
                  className="flex items-stretch min-w-0"
                  style={{ gap: '0px' }}
                  draggable
                  onDragStart={e => handleDragStart(e, task.id)}
                  onMouseEnter={() => setHoveredTaskId(task.id)}
                  onMouseLeave={() => setHoveredTaskId(null)}
                >
                  {/* Square checkbox */}
                  <div
                    className="relative flex-shrink-0"
                    style={{
                      aspectRatio: '1',
                      backgroundColor: getPriorityColor(task.priority),
                      border: `3px solid ${borderColor}`,
                    }}
                    onClick={e => {
                      e.stopPropagation()
                      onPlaySound(false, task.priority)
                      onToggle(task.id)
                    }}
                  >
                    {task.completed && (
                      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <line x1="0" y1="0" x2="100" y2="100" stroke="hsl(var(--h), var(--s), var(--l))" strokeWidth="12" />
                        <line x1="100" y1="0" x2="0" y2="100" stroke="hsl(var(--h), var(--s), var(--l))" strokeWidth="12" />
                      </svg>
                    )}
                  </div>
                  {/* Text rectangle */}
                  <div
                    className="flex-1 min-w-0 flex items-center"
                    style={{
                      border: `3px solid ${borderColor}`,
                      borderLeft: 'none',
                      padding: pad,
                    }}
                    onClick={e => {
                      e.stopPropagation()
                      onTaskClick(task)
                    }}
                  >
                    <span
                      className="block w-full text-left truncate font-mono"
                      style={{
                        color: 'hsl(var(--h), var(--s), var(--l))',
                        fontSize: txtSize,
                        lineHeight: '1.2',
                        fontWeight: isBold ? 700 : 400,
                      }}
                    >
                      {task.text || 'untitled'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )
      })()}

    </div>
  )
}
