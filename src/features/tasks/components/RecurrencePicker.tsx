import type { RecurrenceRule } from '../types'
import { FunctionButton } from '@shared/components/FunctionButton'

interface RecurrencePickerProps {
  recurrence?: RecurrenceRule
  dueDate?: string
  onChange: (recurrence: RecurrenceRule | undefined) => void
}

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export function RecurrencePicker({ recurrence, dueDate, onChange }: RecurrencePickerProps) {
  const freq = recurrence?.frequency
  const dayOfMonth = dueDate ? new Date(dueDate + 'T00:00:00').getDate() : undefined

  const setFrequency = (frequency: RecurrenceRule['frequency'] | 'none') => {
    if (frequency === 'none') {
      onChange(undefined)
      return
    }
    const base: RecurrenceRule = { frequency, interval: 1 }
    if (frequency === 'weekly' || frequency === 'custom') {
      base.frequency = 'custom'
      const today = dueDate ? new Date(dueDate + 'T00:00:00').getDay() : new Date().getDay()
      base.daysOfWeek = [today]
    }
    if (frequency === 'monthly' && dayOfMonth) {
      base.dayOfMonth = dayOfMonth
    }
    onChange(base)
  }

  const toggleDay = (day: number) => {
    if (!recurrence) return
    const current = recurrence.daysOfWeek ?? []
    const next = current.includes(day)
      ? current.filter(d => d !== day)
      : [...current, day].sort((a, b) => a - b)
    if (next.length === 0) return
    onChange({ ...recurrence, daysOfWeek: next })
  }

  const setEndDate = (endDate: string | undefined) => {
    if (!recurrence) return
    onChange({ ...recurrence, endDate })
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Frequency buttons */}
      <div className="flex gap-2">
        {(['none', 'daily', 'weekly', 'monthly'] as const).map(f => {
          const isActive = f === 'none'
            ? !recurrence
            : f === 'weekly'
              ? freq === 'custom' || freq === 'weekly'
              : freq === f
          return (
            <FunctionButton
              key={f}
              size="sm"
              fullWidth={false}
              isActive={isActive}
              onClick={() => setFrequency(f)}
            >
              {f}
            </FunctionButton>
          )
        })}
      </div>

      {/* Day-of-week toggles for weekly/custom */}
      {(freq === 'custom' || freq === 'weekly') && (
        <div className="flex gap-1">
          {DAY_LABELS.map((label, i) => {
            const isActive = recurrence?.daysOfWeek?.includes(i) ?? false
            return (
              <FunctionButton
                key={i}
                size="sm"
                fullWidth={false}
                isActive={isActive}
                onClick={() => toggleDay(i)}
                style={{ minWidth: '36px', padding: '4px 0' }}
              >
                {label}
              </FunctionButton>
            )
          })}
        </div>
      )}

      {/* Monthly info */}
      {freq === 'monthly' && dayOfMonth && (
        <p
          className="font-mono text-xs font-bold"
          style={{ color: 'hsla(var(--h), var(--s), var(--l), 0.6)' }}
        >
          every month on day {dayOfMonth}
        </p>
      )}

      {/* End date */}
      {recurrence && (
        <div className="flex items-center gap-2">
          <span
            className="font-mono text-xs font-bold"
            style={{ color: 'hsla(var(--h), var(--s), var(--l), 0.6)' }}
          >
            ends:
          </span>
          <input
            type="date"
            value={recurrence.endDate ?? ''}
            onChange={e => setEndDate(e.target.value || undefined)}
            className="font-mono text-xs bg-transparent border-none outline-none font-bold"
            style={{ color: 'hsl(var(--h), var(--s), var(--l))' }}
          />
          {recurrence.endDate && (
            <button
              onClick={() => setEndDate(undefined)}
              className="font-mono text-xs font-bold"
              style={{ color: 'hsla(var(--h), var(--s), var(--l), 0.4)' }}
            >
              clear
            </button>
          )}
        </div>
      )}
    </div>
  )
}
