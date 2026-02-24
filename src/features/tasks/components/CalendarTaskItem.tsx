import type { Task } from '../types'

interface CalendarTaskItemProps {
  task: Task
  onToggle: (id: string) => void
  onCyclePriority: (id: string) => void
  onClick: (task: Task) => void
  onPlaySound: (isSubtask: boolean, priority?: number) => void
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

export function CalendarTaskItem({ task, onToggle, onCyclePriority: _onCyclePriority, onClick, onPlaySound, categoryColor, draggable: isDraggable, onDragStart }: CalendarTaskItemProps) {
  const border = '3px solid hsla(var(--h), var(--s), var(--l), 0.2)'

  return (
    <div
      className="flex items-stretch min-w-0"
      style={{ gap: '0px', cursor: isDraggable ? 'grab' : undefined }}
      draggable={isDraggable}
      onDragStart={onDragStart}
    >
      {/* Square checkbox */}
      <div
        className="relative flex-shrink-0"
        style={{
          width: 'clamp(18px, 2.5vw, 28px)',
          aspectRatio: '1',
          backgroundColor: getPriorityColor(task.priority),
          border,
        }}
        onMouseDown={(e) => {
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

      {/* Task text box — tag color as fill */}
      <div
        className="flex-1 min-w-0 flex items-center"
        style={{
          border,
          borderLeft: 'none',
          backgroundColor: categoryColor ? categoryColor + '30' : undefined,
          padding: 'var(--sp-xs) var(--sp-sm)',
        }}
        onMouseDown={(e) => {
          e.stopPropagation()
          onClick(task)
        }}
      >
        <span
          className="block w-full text-left truncate font-mono"
          style={{
            color: 'hsl(var(--h), var(--s), var(--l))',
            fontSize: 'clamp(11px, 1.3vw, 14px)',
            lineHeight: '1.2',
            fontWeight: 400,
          }}
        >
          {task.text || 'untitled'}
        </span>
      </div>
    </div>
  )
}
