import { useState } from 'react'
import type { Task } from '../types'

interface CalendarTaskItemProps {
  task: Task
  onToggle: (id: string) => void
  onCyclePriority: (id: string) => void
  onClick: (task: Task) => void
  onPlaySound: (isSubtask: boolean) => void
}

export function CalendarTaskItem({ task, onToggle, onCyclePriority, onClick, onPlaySound }: CalendarTaskItemProps) {
  const [isHovered, setIsHovered] = useState(false)

  const getPriorityColor = () => {
    switch (task.priority) {
      case 0: return 'transparent'
      case 1: return 'hsl(45, 90%, 55%)'
      case 2: return 'hsl(0, 80%, 55%)'
    }
  }

  const getDotColor = () => {
    switch (task.priority) {
      case 0: return 'hsla(var(--h), var(--s), var(--l), 0.2)'
      case 1: return 'hsl(45, 90%, 55%)'
      case 2: return 'hsl(0, 80%, 55%)'
    }
  }

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!task.completed) {
      onPlaySound(false)
    }
    onToggle(task.id)
  }

  return (
    <div
      className="flex items-center gap-2 px-2 py-1.5 font-mono select-none rounded"
      style={{
        borderLeft: task.priority > 0 ? `3px solid ${getPriorityColor()}` : '3px solid transparent',
        backgroundColor: isHovered ? 'hsla(var(--h), var(--s), 50%, 0.08)' : 'transparent',
        opacity: 1,
        textDecoration: task.completed ? 'line-through' : 'none',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Checkbox */}
      <button
        onClick={handleToggle}
        className="w-4 h-4 flex items-center justify-center flex-shrink-0"
        style={{
          border: `3px solid hsla(var(--h), var(--s), var(--l), ${task.completed ? 0.2 : 0.35})`,
          borderRadius: 0,
          backgroundColor: task.completed ? 'hsla(var(--h), var(--s), var(--l), 0.1)' : 'transparent',
        }}
      >
        {task.completed && (
          <svg width="8" height="8" viewBox="0 0 14 14" fill="none">
            <path
              d="M3 7L6 10L11 4"
              stroke="hsla(var(--h), var(--s), var(--l), 0.4)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      {/* Task text */}
      <button
        onClick={() => onClick(task)}
        className="flex-1 min-w-0 text-left truncate font-black uppercase"
        style={{ color: 'hsl(var(--h), var(--s), var(--l))', fontSize: 'clamp(11px, 1.3vw, 14px)' }}
      >
        {task.text || 'untitled'}
      </button>

      {/* Priority dot */}
      <button
        onClick={e => { e.stopPropagation(); onCyclePriority(task.id) }}
        className="w-5 h-5 flex items-center justify-center flex-shrink-0"
        title={`Priority ${task.priority} — click to cycle`}
      >
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: getDotColor() }}
        />
      </button>
    </div>
  )
}
