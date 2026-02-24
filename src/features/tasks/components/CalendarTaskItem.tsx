import { useState } from 'react'
import type { Task } from '../types'

interface CalendarTaskItemProps {
  task: Task
  onToggle: (id: string) => void
  onCyclePriority: (id: string) => void
  onClick: (task: Task) => void
  onPlaySound: (isSubtask: boolean) => void
  categoryColor?: string
  isSelected?: boolean
  draggable?: boolean
  onDragStart?: (e: React.DragEvent) => void
}

function getPriorityColor(priority: number): string {
  switch (priority) {
    case 2: return 'hsl(0, 80%, 55%)'
    case 1: return 'hsl(45, 90%, 55%)'
    default: return 'transparent'
  }
}

export function CalendarTaskItem({ task, onToggle, onCyclePriority: _onCyclePriority, onClick, onPlaySound, categoryColor, isSelected, draggable: isDraggable, onDragStart }: CalendarTaskItemProps) {
  const [hovered, setHovered] = useState(false)
  const borderColor = categoryColor ?? 'hsla(var(--h), var(--s), var(--l), 0.2)'
  const isBold = hovered || isSelected

  return (
    <div
      className="relative font-mono select-none flex items-center"
      style={{
        backgroundColor: getPriorityColor(task.priority),
        border: `3px solid ${borderColor}`,
        cursor: isDraggable ? 'grab' : undefined,
      }}
      draggable={isDraggable}
      onDragStart={onDragStart}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* X overlay when completed */}
      {task.completed && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-20" viewBox="0 0 100 100" preserveAspectRatio="none">
          <line x1="0" y1="0" x2="100" y2="100" stroke="hsl(var(--h), var(--s), var(--l))" strokeWidth="6" />
          <line x1="100" y1="0" x2="0" y2="100" stroke="hsl(var(--h), var(--s), var(--l))" strokeWidth="6" />
        </svg>
      )}

      {/* Task text — click to edit */}
      <button
        className="relative z-10 flex-1 min-w-0 text-left truncate px-2 py-1"
        style={{
          color: 'hsl(var(--h), var(--s), var(--l))',
          fontSize: 'clamp(11px, 1.3vw, 14px)',
          fontWeight: isBold ? 700 : 400,
        }}
        onClick={() => onClick(task)}
      >
        {task.text || 'untitled'}
      </button>

      {/* Toggle zone — right side */}
      <button
        className="relative z-10 flex-shrink-0 self-stretch px-2"
        onClick={() => {
          if (!task.completed) onPlaySound(false)
          onToggle(task.id)
        }}
        style={{ color: 'hsl(var(--h), var(--s), var(--l))', fontSize: 'clamp(11px, 1.3vw, 14px)' }}
      >
        {task.completed ? '×' : '·'}
      </button>
    </div>
  )
}
