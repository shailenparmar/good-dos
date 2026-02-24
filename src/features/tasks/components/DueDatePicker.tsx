import { getRelativeDateText, isOverdue } from '@shared/utils/date'

interface DueDatePickerProps {
  dueDate?: string
  onChange: (date: string | undefined) => void
}

export function DueDatePicker({ dueDate, onChange }: DueDatePickerProps) {
  const overdue = dueDate ? isOverdue(dueDate) : false

  return (
    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
      {dueDate && (
        <span
          className="text-xs font-mono"
          style={{
            color: overdue ? 'hsl(0, 80%, 55%)' : 'hsla(var(--h), var(--s), var(--l), 0.5)',
          }}
        >
          {getRelativeDateText(dueDate)}
        </span>
      )}
      <input
        type="date"
        value={dueDate ?? ''}
        onChange={e => onChange(e.target.value || undefined)}
        className="text-xs font-mono bg-transparent border-none outline-none opacity-0 w-5 h-5"
        style={{ color: 'hsl(var(--h), var(--s), var(--l))' }}
      />
    </div>
  )
}
