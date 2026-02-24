import { useState, useEffect } from 'react'
import type { Task } from '../types'
import { getRandomMessage } from '@shared/utils/messages'

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
}

function getPriorityColor(priority: number): string {
  switch (priority) {
    case 2: return 'hsl(0, 80%, 55%)'
    case 1: return 'hsl(45, 90%, 55%)'
    default: return 'transparent'
  }
}

export function MonthDayCell({ date, dateStr, tasks, isToday, isCurrentMonth, filterMatch = 'none', isActiveHighlight, isLockedDate, onClick, onToggle, onTaskClick, onPlaySound }: MonthDayCellProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [boomId, setBoomId] = useState<string | null>(null)
  const [boomMsg, setBoomMsg] = useState('')

  // Keep booming task in its original position (don't shift to completed yet)
  const incompleteTasks = tasks.filter(t => !t.completed || t.id === boomId)
  const completedTasks = tasks.filter(t => t.completed && t.id !== boomId)
  const allTasks = [...incompleteTasks, ...completedTasks]
  const hasTasks = incompleteTasks.length > 0

  useEffect(() => {
    if (!boomId) return
    const t = setTimeout(() => setBoomId(null), 900)
    return () => clearTimeout(t)
  }, [boomId])

  // ── Background ──
  let bgColor = 'hsla(var(--h), var(--s), var(--l), 0.015)'
  if (isLockedDate) {
    bgColor = 'hsla(var(--h), var(--s), var(--l), 0.3)'
  } else if (filterMatch === 'match') {
    bgColor = isActiveHighlight
      ? 'hsla(var(--h), var(--s), var(--l), 0.3)'
      : 'hsla(var(--h), var(--s), var(--l), 0.15)'
  } else if (hasTasks) {
    bgColor = isHovered
      ? 'hsla(var(--h), var(--s), var(--l), 0.14)'
      : isToday
        ? 'hsla(var(--h), var(--s), calc(var(--l) + 4%), 0.18)'
        : 'hsla(var(--h), var(--s), var(--l), 0.07)'
  } else if (isToday) {
    bgColor = isHovered
      ? 'hsla(var(--h), var(--s), calc(var(--l) + 4%), 0.16)'
      : 'hsla(var(--h), var(--s), calc(var(--l) + 4%), 0.10)'
  } else if (isHovered) {
    bgColor = 'hsla(var(--h), var(--s), var(--l), 0.05)'
  }

  // ── Opacity ──
  const cellOpacity = isCurrentMonth ? 1 : 0.12

  // ── Border — BOX the matches, DOUBLE-BOX the leader ──
  let borderStyle = '3px solid transparent'
  if (isLockedDate) {
    borderStyle = '12px solid hsl(var(--h), var(--s), var(--l))'
  } else if (filterMatch === 'match' && isActiveHighlight) {
    borderStyle = '12px solid hsl(var(--h), var(--s), var(--l))'
  } else if (filterMatch === 'match') {
    borderStyle = '6px solid hsla(var(--h), var(--s), var(--l), 0.6)'
  }

  const handleSmack = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation()
    onPlaySound(false, task.priority)
    setBoomId(task.id)
    setBoomMsg(getRandomMessage())
    onToggle(task.id)
  }

  return (
    <div
      className="relative overflow-hidden cursor-pointer rounded-none"
      style={{
        opacity: cellOpacity,
        backgroundColor: bgColor,
        border: borderStyle,
        borderRight: '3px solid hsla(var(--h), var(--s), var(--l), 0.08)',
        borderBottom: '3px solid hsla(var(--h), var(--s), var(--l), 0.08)',
      }}
      onClick={() => onClick(dateStr)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Day number / TODAY — HUGE, centered, background layer */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
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

      {/* Tasks — 2-column grid, shrinks to fit */}
      {allTasks.length > 0 && (() => {
        const useTwoCols = allTasks.length > 3
        const totalRows = useTwoCols ? Math.ceil(allTasks.length / 2) : allTasks.length
        // Scale square + text down when many tasks
        const sqSize = totalRows <= 3 ? 'clamp(20px, 3vw, 32px)' : totalRows <= 5 ? 'clamp(16px, 2.2vw, 24px)' : 'clamp(12px, 1.6vw, 18px)'
        const txtSize = totalRows <= 3 ? 'clamp(12px, 1.6vw, 16px)' : totalRows <= 5 ? 'clamp(10px, 1.2vw, 13px)' : 'clamp(8px, 1vw, 11px)'
        const gap = totalRows <= 3 ? '4px' : '2px'

        return (
          <div
            className="relative z-10 h-full grid overflow-hidden p-1"
            style={{
              gridTemplateColumns: useTwoCols ? '1fr 1fr' : '1fr',
              gap,
            }}
          >
            {allTasks.map(task => {
              const isDone = task.completed
              const isBooming = boomId === task.id
              const justBoomed = isDone && isBooming

              return (
                <div
                  key={task.id}
                  className="flex items-center gap-1 min-w-0"
                >
                  {isDone ? (
                    <button
                      className="flex-shrink-0 relative active:scale-75 cursor-pointer"
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
                        ...(isBooming ? { transform: 'scale(0)', opacity: 0 } : {}),
                      }}
                      onClick={e => handleSmack(task, e)}
                    />
                  )}
                  <button
                    className="flex-1 min-w-0 text-left truncate font-mono font-black uppercase"
                    style={{
                      color: 'hsl(var(--h), var(--s), var(--l))',
                      opacity: isBooming ? 0.5 : 1,
                      fontSize: txtSize,
                      lineHeight: '1.2',
                      textDecoration: isDone && !justBoomed ? 'line-through' : 'none',
                    }}
                    onClick={e => {
                      e.stopPropagation()
                      if (!isDone) onTaskClick(task)
                    }}
                  >
                    {isBooming || justBoomed ? boomMsg : (task.text || 'untitled')}
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
