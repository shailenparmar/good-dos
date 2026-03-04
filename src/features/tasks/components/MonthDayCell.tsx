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
  isCursor?: boolean
}

function getPriorityColor(priority: number): string {
  switch (priority) {
    case 2: return 'hsl(0, 80%, 55%)'
    case 1: return 'hsl(45, 90%, 55%)'
    default: return 'transparent'
  }
}

export function MonthDayCell({ date, dateStr, tasks, isToday, isCurrentMonth, filterMatch = 'none', isActiveHighlight, isLockedDate, onClick, onToggle, onTaskClick, onPlaySound, onMoveTask, categoryColorMap, selectedTaskId, isCursor }: MonthDayCellProps) {
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

  let bgColor = 'transparent'
  if (isLockedDate) {
    bgColor = 'hsla(var(--h), var(--s), var(--l), 0.2)'
  } else if (filterMatch === 'match') {
    bgColor = isActiveHighlight
      ? 'hsla(var(--h), var(--s), var(--l), 0.2)'
      : 'hsla(var(--h), var(--s), var(--l), 0.1)'
  }

  const cellOpacity = isCurrentMonth ? 1 : 0.12

  const hasSelectedTask = selectedTaskId ? allTasks.some(t => t.id === selectedTaskId) : false
  let highlightShadow = 'none'
  if (isLockedDate) {
    highlightShadow = 'inset 0 0 0 12px hsla(var(--h), var(--s), var(--l), 0.7)'
  } else if (filterMatch === 'match' && isActiveHighlight) {
    highlightShadow = 'inset 0 0 0 12px hsla(var(--h), var(--s), var(--l), 0.7)'
  } else if (filterMatch === 'match') {
    highlightShadow = 'inset 0 0 0 6px hsla(var(--h), var(--s), var(--l), 0.6)'
  } else if (isCursor) {
    highlightShadow = 'inset 0 0 0 6px hsla(var(--h), var(--s), var(--l), 0.4)'
  } else if (hasSelectedTask) {
    highlightShadow = 'inset 0 0 0 3px hsla(var(--h), var(--s), var(--l), 0.4)'
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
      onMouseDown={() => onClick(dateStr)}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Day number / TODAY watermark */}
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
            {date.getDate()}
          </span>
        )}
      </div>

      {/* Tasks */}
      {allTasks.length > 0 && (() => {
        const totalRows = allTasks.length
        const sqSize = totalRows <= 3 ? 'clamp(18px, 2.5vw, 28px)' : totalRows <= 5 ? 'clamp(14px, 2vw, 22px)' : 'clamp(10px, 1.4vw, 16px)'
        const txtSize = totalRows <= 3 ? 'clamp(13px, 1.8vw, 18px)' : totalRows <= 5 ? 'clamp(11px, 1.4vw, 15px)' : 'clamp(9px, 1.1vw, 12px)'
        const pad = totalRows <= 3 ? 'var(--sp-xs) var(--sp-sm)' : '2px 4px'
        const defaultBorder = '3px solid hsla(var(--h), var(--s), var(--l), 0.2)'

        return (
          <div
            className="relative z-10 h-full flex flex-col overflow-hidden"
            style={{ padding: 'var(--sp-xs)' }}
          >
            {allTasks.map((task, idx) => {
              const catColor = task.categoryId ? categoryColorMap?.[task.categoryId] : undefined
              return (
                <div
                  key={task.id}
                  className="flex items-stretch min-w-0"
                  style={{ marginTop: idx > 0 ? '-3px' : undefined }}
                  draggable
                  onDragStart={e => handleDragStart(e, task.id)}
                >
                  {/* Square checkbox */}
                  <div
                    className="relative flex-shrink-0"
                    style={{
                      width: sqSize,
                      aspectRatio: '1',
                      backgroundColor: getPriorityColor(task.priority),
                      border: defaultBorder,
                    }}
                    onClick={e => e.stopPropagation()}
                    onMouseDown={e => {
                      e.stopPropagation()
                      if (!task.completed) onPlaySound(false, task.priority)
                      onToggle(task.id)
                    }}
                  >
                    {task.completed && (
                      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <line x1="15" y1="15" x2="85" y2="85" stroke="hsl(var(--h), var(--s), var(--l))" strokeWidth="12" strokeLinecap="butt" />
                        <line x1="85" y1="15" x2="15" y2="85" stroke="hsl(var(--h), var(--s), var(--l))" strokeWidth="12" strokeLinecap="butt" />
                      </svg>
                    )}
                  </div>
                  {/* Task text box — tag color as border and fill */}
                  <div
                    className="flex-1 min-w-0 flex items-center"
                    style={{
                      border: catColor ? `3px solid ${catColor}` : defaultBorder,
                      borderLeft: 'none',
                      backgroundColor: catColor ? catColor + '30' : undefined,
                      padding: pad,
                    }}
                    onClick={e => e.stopPropagation()}
                    onMouseDown={e => {
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
