interface ProgressBarProps {
  completed: number
  total: number
}

export function ProgressBar({ completed, total }: ProgressBarProps) {
  if (total === 0) return null
  const pct = (completed / total) * 100

  return (
    <div
      className="h-1 w-full overflow-hidden"
      style={{ backgroundColor: 'hsla(var(--h), var(--s), var(--l), 0.1)' }}
    >
      <div
        className="h-full"
        style={{
          width: `${pct}%`,
          backgroundColor: 'hsla(var(--h), var(--s), var(--l), 0.5)',
        }}
      />
    </div>
  )
}
