import type { Task } from '../types'

interface CalendarTaskItemProps {
  task: Task
  onToggle: (id: string) => void
  onCyclePriority: (id: string) => void
  onClick: (task: Task) => void
  onPlaySound: (isSubtask: boolean) => void
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

export function CalendarTaskItem({ task, onToggle, onCyclePriority: _onCyclePriority, onClick, onPlaySound, draggable: isDraggable, onDragStart }: CalendarTaskItemProps) {
  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (!task.completed) {
      onPlaySound(false)
    }
    onToggle(task.id)
  }

  return (
    <div
      className="flex items-center gap-2 px-2 py-1.5 font-mono select-none group"
      style={{
        textDecoration: task.completed ? 'line-through' : 'none',
      }}
      onMouseDown={() => onClick(task)}
      draggable={isDraggable}
      onDragStart={onDragStart}
    >
      {/* Checkbox — colored by priority, same as month view */}
      {task.completed ? (
        <button
          onMouseDown={handleToggle}
          className="w-5 h-5 flex-shrink-0 relative active:scale-75"
          style={{
            backgroundColor: 'transparent',
            border: '3px solid black',
          }}
        >
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <line x1="0" y1="0" x2="100" y2="100" stroke="hsl(var(--h), var(--s), var(--l))" strokeWidth="12" />
            <line x1="100" y1="0" x2="0" y2="100" stroke="hsl(var(--h), var(--s), var(--l))" strokeWidth="12" />
          </svg>
        </button>
      ) : (
        <button
          onMouseDown={handleToggle}
          className="w-5 h-5 flex-shrink-0 active:scale-75"
          style={{
            backgroundColor: getPriorityColor(task.priority),
            border: '3px solid black',
          }}
        />
      )}

      {/* Task text */}
      <span
        className="flex-1 min-w-0 text-left truncate font-normal group-hover:font-black"
        style={{ color: 'hsl(var(--h), var(--s), var(--l))', fontSize: 'clamp(11px, 1.3vw, 14px)' }}
      >
        {task.text || 'untitled'}
      </span>
    </div>
  )
}
