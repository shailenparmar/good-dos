interface PriorityIndicatorProps {
  priority: 0 | 1 | 2
  onClick: () => void
}

export function PriorityIndicator({ priority, onClick }: PriorityIndicatorProps) {
  const getColor = () => {
    switch (priority) {
      case 0: return 'hsla(var(--h), var(--s), var(--l), 0.25)'
      case 1: return 'hsl(45, 90%, 55%)'
      case 2: return 'hsl(0, 80%, 55%)'
    }
  }

  return (
    <button
      onClick={e => { e.stopPropagation(); onClick() }}
      className="w-11 h-11 flex items-center justify-center flex-shrink-0"
      title={`Priority ${priority} — click to cycle`}
    >
      <div
        className="w-4 h-4"
        style={{ backgroundColor: getColor() }}
      />
    </button>
  )
}
